import { db } from "@/lib/db";
import {
  goals,
  objectives,
  Goal,
  NewGoal,
  ProgressUpdate,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getLatestProgressUpdatesForGoals,
  getLatestProgressUpdateForGoal,
} from "@/lib/db/progress-updates";

export type GoalWithLatestUpdate = Goal & {
  latestProgressUpdate: ProgressUpdate | null;
};

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  return db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: [desc(goals.createdAt)],
  });
}

export async function getGoalsByUserIdWithLatestUpdate(
  userId: string
): Promise<GoalWithLatestUpdate[]> {
  const rows = await getGoalsByUserId(userId);
  if (rows.length === 0) return [];
  const latest = await getLatestProgressUpdatesForGoals(rows.map((g) => g.id));
  return rows.map((g) => ({
    ...g,
    latestProgressUpdate: latest.get(g.id) ?? null,
  }));
}

export async function getGoalById(
  id: string,
  userId: string
): Promise<Goal | undefined> {
  return db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, userId)),
  });
}

export async function getGoalByIdWithLatestUpdate(
  id: string,
  userId: string
): Promise<GoalWithLatestUpdate | null> {
  const goal = await getGoalById(id, userId);
  if (!goal) return null;
  const latestProgressUpdate = await getLatestProgressUpdateForGoal(id);
  return { ...goal, latestProgressUpdate };
}

/**
 * An objectiveId is caller-supplied input: it must be proven to belong to the
 * same user before persisting the reference, or any user could attach their
 * goals to another user's objective by guessing its UUID.
 */
async function objectiveOwnedByUser(
  objectiveId: string,
  userId: string
): Promise<boolean> {
  const objective = await db.query.objectives.findFirst({
    where: and(eq(objectives.id, objectiveId), eq(objectives.userId, userId)),
  });
  return !!objective;
}

export async function createGoal(
  data: Omit<NewGoal, "id" | "createdAt" | "updatedAt">
): Promise<Goal | null> {
  if (
    data.objectiveId &&
    !(await objectiveOwnedByUser(data.objectiveId, data.userId))
  ) {
    return null;
  }

  const [goal] = await db.insert(goals).values(data).returning();
  return goal;
}

export async function updateGoal(
  id: string,
  userId: string,
  data: Partial<Omit<NewGoal, "id" | "userId" | "createdAt">>
): Promise<Goal | null> {
  if (
    data.objectiveId &&
    !(await objectiveOwnedByUser(data.objectiveId, userId))
  ) {
    return null;
  }

  const [goal] = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return goal || null;
}

/**
 * Move a goal from `not_started` to `in_progress` on its first sign of
 * activity (a progress update, a completed todo, or a completed milestone).
 * Idempotent: a no-op once the goal has left `not_started`, so callers can
 * fire it unconditionally after a successful write.
 */
export async function markGoalStarted(goalId: string): Promise<void> {
  await db
    .update(goals)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.status, "not_started")));
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
