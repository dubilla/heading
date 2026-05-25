import { db } from "@/lib/db";
import { todos, goals, Todo, NewTodo } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { markGoalStarted } from "@/lib/db/goals";
import { createCrewTask, completeCrewTask } from "@/lib/integrations/crew";

export async function getTodosByUserId(
  userId: string,
  options?: {
    goalId?: string;
    milestoneId?: string;
    completed?: boolean;
    dueBefore?: Date;
    dueAfter?: Date;
  }
): Promise<Todo[]> {
  // Get all goal IDs for this user
  const userGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    columns: { id: true },
  });
  const goalIds = userGoals.map((g) => g.id);

  if (goalIds.length === 0) {
    return [];
  }

  let allTodos: Todo[] = [];

  // Fetch todos for each goal (Drizzle doesn't support IN with subquery easily)
  for (const goalId of goalIds) {
    if (options?.goalId && goalId !== options.goalId) continue;

    const goalTodos = await db.query.todos.findMany({
      where: eq(todos.goalId, goalId),
      orderBy: [asc(todos.dueDate), desc(todos.createdAt)],
    });
    allTodos = [...allTodos, ...goalTodos];
  }

  // Apply filters
  if (options?.milestoneId) {
    allTodos = allTodos.filter((t) => t.milestoneId === options.milestoneId);
  }

  if (options?.completed !== undefined) {
    allTodos = allTodos.filter((t) => t.completed === options.completed);
  }

  if (options?.dueBefore) {
    allTodos = allTodos.filter(
      (t) => t.dueDate && new Date(t.dueDate) <= options.dueBefore!
    );
  }

  if (options?.dueAfter) {
    allTodos = allTodos.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= options.dueAfter!
    );
  }

  return allTodos;
}

export async function getTodosByGoalId(
  goalId: string,
  userId: string
): Promise<Todo[]> {
  // Verify goal belongs to user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return [];
  }

  return db.query.todos.findMany({
    where: eq(todos.goalId, goalId),
    orderBy: [asc(todos.dueDate), desc(todos.createdAt)],
  });
}

export async function getTodosByMilestoneId(
  milestoneId: string,
  userId: string
): Promise<Todo[]> {
  const milestoneTodos = await db.query.todos.findMany({
    where: eq(todos.milestoneId, milestoneId),
  });

  if (milestoneTodos.length === 0) {
    return [];
  }

  // Verify that the goal belongs to the user
  const goal = await db.query.goals.findFirst({
    where: and(
      eq(goals.id, milestoneTodos[0].goalId),
      eq(goals.userId, userId)
    ),
  });

  if (!goal) {
    return [];
  }

  return milestoneTodos;
}

export async function getTodoById(
  id: string,
  userId: string
): Promise<Todo | undefined> {
  const todo = await db.query.todos.findFirst({
    where: eq(todos.id, id),
  });

  if (!todo) {
    return undefined;
  }

  // Verify goal belongs to user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, todo.goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return undefined;
  }

  return todo;
}

export async function createTodo(
  data: Omit<
    NewTodo,
    "id" | "createdAt" | "updatedAt" | "completed" | "completedAt"
  >,
  userId: string
): Promise<Todo | null> {
  // Verify goal belongs to user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, data.goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return null;
  }

  const [todo] = await db
    .insert(todos)
    .values({
      ...data,
      completed: false,
    })
    .returning();

  return linkTodoToCrew(todo);
}

/**
 * Push a freshly-created todo to Crew and cache the returned task id. Shared by
 * `createTodo` and the AI-plan acceptance path so every Heading-origin todo
 * lands in Crew. Best-effort: if the integration is off or Crew is unreachable,
 * the todo keeps a null crewTaskId (graceful degradation), to be retried on a
 * later write.
 */
export async function linkTodoToCrew(todo: Todo): Promise<Todo> {
  const crewTaskId = await createCrewTask(todo);
  if (!crewTaskId) return todo;

  const [updated] = await db
    .update(todos)
    .set({ crewTaskId, updatedAt: new Date() })
    .where(eq(todos.id, todo.id))
    .returning();
  return updated ?? todo;
}

export async function updateTodo(
  id: string,
  userId: string,
  data: Partial<Omit<NewTodo, "id" | "goalId" | "createdAt">>
): Promise<Todo | null> {
  const existingTodo = await getTodoById(id, userId);

  if (!existingTodo) {
    return null;
  }

  // Handle completion timestamp
  const updateData: Partial<NewTodo> & { completedAt?: Date | null } = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.completed !== undefined) {
    updateData.completedAt = data.completed ? new Date() : null;
  }

  const [todo] = await db
    .update(todos)
    .set(updateData)
    .where(eq(todos.id, id))
    .returning();

  // A genuine open -> complete transition (not a no-op re-complete).
  const justCompleted =
    existingTodo.completed === false && data.completed === true;

  if (justCompleted) {
    // Completing a todo is a progress signal that starts the goal.
    await markGoalStarted(existingTodo.goalId);

    // Mirror the completion to Crew. Guarded on the transition so re-saving an
    // already-complete todo doesn't re-fire; the inbound webhook path uses
    // `completeTodoFromCrew` (no write-back), so there's no completion loop.
    if (existingTodo.crewTaskId) {
      await completeCrewTask(existingTodo.crewTaskId);
    }
  }

  return todo || null;
}

/**
 * Flip a todo to completed in response to Crew's completion webhook. Unlike
 * `updateTodo`, this is keyed by todo id alone (no user scope — the caller is
 * an authenticated machine principal) and deliberately does NOT write back to
 * Crew, since the completion originated there. Idempotent on the open ->
 * complete transition, so duplicate webhook deliveries are no-ops.
 *
 * Returns true if a todo was found (whether or not it changed), false if no
 * todo matches the id.
 */
export async function completeTodoFromCrew(todoId: string): Promise<boolean> {
  const existing = await db.query.todos.findFirst({
    where: eq(todos.id, todoId),
  });

  if (!existing) {
    return false;
  }

  if (existing.completed) {
    return true; // already complete — idempotent no-op
  }

  await db
    .update(todos)
    .set({ completed: true, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(todos.id, todoId));

  // Completion is a start signal, just like a local toggle.
  await markGoalStarted(existing.goalId);

  return true;
}

export async function deleteTodo(id: string, userId: string): Promise<boolean> {
  const existingTodo = await getTodoById(id, userId);

  if (!existingTodo) {
    return false;
  }

  const result = await db
    .delete(todos)
    .where(eq(todos.id, id))
    .returning({ id: todos.id });

  return result.length > 0;
}

export async function getTodoStats(userId: string) {
  const allTodos = await getTodosByUserId(userId);
  const total = allTodos.length;
  const completed = allTodos.filter((t) => t.completed).length;
  const pending = total - completed;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const dueThisWeek = allTodos.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= today && dueDate <= endOfWeek;
  }).length;

  const overdue = allTodos.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return new Date(t.dueDate) < today;
  }).length;

  return { total, completed, pending, dueThisWeek, overdue };
}
