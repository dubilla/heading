import { db } from "@/lib/db";
import { todos, goals, milestones, Todo, NewTodo } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { markGoalStarted } from "@/lib/db/goals";
import {
  createCrewTask,
  completeCrewTask,
  linkCrewTask,
  updateCrewTask,
} from "@/lib/integrations/crew";

export type TodoWithGoal = Todo & {
  goal: { id: string; title: string };
};

export async function getTodosByUserId(
  userId: string,
  options?: {
    goalId?: string;
    milestoneId?: string;
    completed?: boolean;
    dueBefore?: Date;
    dueAfter?: Date;
  }
): Promise<TodoWithGoal[]> {
  // Get all goals for this user (need title to render the "Goal: <title>"
  // backlink on each todo).
  const userGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    columns: { id: true, title: true },
  });

  if (userGoals.length === 0) {
    return [];
  }

  let allTodos: TodoWithGoal[] = [];

  // Fetch todos for each goal (Drizzle doesn't support IN with subquery easily)
  for (const goal of userGoals) {
    if (options?.goalId && goal.id !== options.goalId) continue;

    const goalTodos = await db.query.todos.findMany({
      where: eq(todos.goalId, goal.id),
      orderBy: [asc(todos.dueDate), desc(todos.createdAt)],
    });
    allTodos = [
      ...allTodos,
      ...goalTodos.map((t) => ({
        ...t,
        goal: { id: goal.id, title: goal.title },
      })),
    ];
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

/**
 * A milestoneId is caller-supplied input: it must be proven to belong to the
 * goal being written (which the caller has already scoped to the user), or any
 * user could attach todos to another user's milestone by guessing its UUID.
 */
async function milestoneBelongsToGoal(
  milestoneId: string,
  goalId: string
): Promise<boolean> {
  const milestone = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.goalId, goalId)),
  });
  return !!milestone;
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

  if (
    data.milestoneId &&
    !(await milestoneBelongsToGoal(data.milestoneId, data.goalId))
  ) {
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
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, todo.goalId),
  });
  const crewTaskId = await createCrewTask(
    todo,
    goal ? { id: goal.id, title: goal.title } : undefined
  );
  if (!crewTaskId) return todo;

  const [updated] = await db
    .update(todos)
    .set({ crewTaskId, updatedAt: new Date() })
    .where(eq(todos.id, todo.id))
    .returning();
  return updated ?? todo;
}

export type LinkCrewTaskResult =
  | { ok: true; todo: Todo }
  | {
      ok: false;
      reason: "goal_not_found" | "milestone_not_found" | "conflict" | "error";
    };

/**
 * Link an existing Crew task to a goal (S2). Creates a thin local `crew`-origin
 * todo, then adopts the Crew task (stamps it with this todo's id as the
 * external link) so completion syncs both ways like a Heading-origin todo.
 *
 * Unlike `createTodo`, the Crew call is NOT best-effort: if adoption fails the
 * local row is rolled back, because a crew-origin todo with no working link is
 * a dead row the user can't act on.
 */
export async function linkExistingCrewTask(
  data: {
    goalId: string;
    milestoneId?: string | null;
    crewTaskId: string;
    title: string;
    dueDate?: string | null;
  },
  userId: string
): Promise<LinkCrewTaskResult> {
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, data.goalId), eq(goals.userId, userId)),
  });
  if (!goal) {
    return { ok: false, reason: "goal_not_found" };
  }

  if (
    data.milestoneId &&
    !(await milestoneBelongsToGoal(data.milestoneId, data.goalId))
  ) {
    return { ok: false, reason: "milestone_not_found" };
  }

  const [todo] = await db
    .insert(todos)
    .values({
      goalId: data.goalId,
      milestoneId: data.milestoneId ?? null,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completed: false,
      crewTaskId: data.crewTaskId,
      origin: "crew",
    })
    .returning();

  const result = await linkCrewTask(data.crewTaskId, todo.id, {
    id: goal.id,
    title: goal.title,
  });
  if (result !== "ok") {
    // Roll back the dead local row so the user can retry cleanly.
    await db.delete(todos).where(eq(todos.id, todo.id));
    return { ok: false, reason: result };
  }

  return { ok: true, todo };
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

  if (
    data.milestoneId &&
    !(await milestoneBelongsToGoal(data.milestoneId, existingTodo.goalId))
  ) {
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

  // Mirror content edits to the linked Crew task (best-effort). Keyed on which
  // fields the caller sent, so completion-only toggles don't touch Crew.
  const contentChanged =
    "title" in data || "description" in data || "dueDate" in data;
  if (todo && existingTodo.crewTaskId && contentChanged) {
    await updateCrewTask(existingTodo.crewTaskId, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
    });
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
