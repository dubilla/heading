import { db } from "@/lib/db";
import { todos, goals, Todo, NewTodo } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

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

  return todo;
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

  return todo || null;
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
