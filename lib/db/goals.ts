import { db } from "@/lib/db";
import { goals, Goal, NewGoal } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  return db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: [desc(goals.createdAt)],
  });
}

export async function getGoalById(
  id: string,
  userId: string
): Promise<Goal | undefined> {
  return db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, userId)),
  });
}

export async function createGoal(
  data: Omit<NewGoal, "id" | "createdAt" | "updatedAt">
): Promise<Goal> {
  const [goal] = await db.insert(goals).values(data).returning();
  return goal;
}

export async function updateGoal(
  id: string,
  userId: string,
  data: Partial<Omit<NewGoal, "id" | "userId" | "createdAt">>
): Promise<Goal | null> {
  const [goal] = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return goal || null;
}

export async function deleteGoal(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning({ id: goals.id });
  return result.length > 0;
}

export async function getGoalStats(userId: string) {
  const userGoals = await getGoalsByUserId(userId);
  const total = userGoals.length;
  const completed = userGoals.filter((g) => g.status === "completed").length;
  const inProgress = userGoals.filter(
    (g) => g.status === "in_progress" || g.status === "on_track"
  ).length;
  const offTrack = userGoals.filter((g) => g.status === "off_track").length;

  return { total, completed, inProgress, offTrack };
}
