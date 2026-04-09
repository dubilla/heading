import { db } from "@/lib/db";
import {
  progressUpdates,
  goals,
  ProgressUpdate,
  NewProgressUpdate,
} from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

/**
 * List all progress updates for a goal, newest-occurred first.
 * Also verifies that the goal belongs to the user.
 */
export async function getProgressUpdatesByGoalId(
  goalId: string,
  userId: string
): Promise<ProgressUpdate[] | null> {
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
    columns: { id: true },
  });
  if (!goal) return null;

  return db.query.progressUpdates.findMany({
    where: eq(progressUpdates.goalId, goalId),
    orderBy: [
      desc(progressUpdates.occurredAt),
      desc(progressUpdates.createdAt),
    ],
  });
}

export async function getProgressUpdateById(
  id: string,
  userId: string
): Promise<ProgressUpdate | null> {
  const row = await db
    .select({
      update: progressUpdates,
    })
    .from(progressUpdates)
    .innerJoin(goals, eq(progressUpdates.goalId, goals.id))
    .where(and(eq(progressUpdates.id, id), eq(goals.userId, userId)))
    .limit(1);
  return row[0]?.update ?? null;
}

/**
 * Returns the single most-recent progress update for each of the given goal
 * IDs, using `DISTINCT ON` so we get one row per goal in a single query.
 * Ordering: latest `occurredAt`, tiebroken by `createdAt`.
 */
export async function getLatestProgressUpdatesForGoals(
  goalIds: string[]
): Promise<Map<string, ProgressUpdate>> {
  if (goalIds.length === 0) return new Map();
  const rows = await db
    .selectDistinctOn([progressUpdates.goalId])
    .from(progressUpdates)
    .where(inArray(progressUpdates.goalId, goalIds))
    .orderBy(
      progressUpdates.goalId,
      desc(progressUpdates.occurredAt),
      desc(progressUpdates.createdAt)
    );
  const map = new Map<string, ProgressUpdate>();
  for (const row of rows) {
    map.set(row.goalId, row);
  }
  return map;
}

export async function getLatestProgressUpdateForGoal(
  goalId: string
): Promise<ProgressUpdate | null> {
  const map = await getLatestProgressUpdatesForGoals([goalId]);
  return map.get(goalId) ?? null;
}

export async function createProgressUpdate(
  data: Omit<NewProgressUpdate, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<ProgressUpdate | null> {
  // Verify goal ownership before insert.
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, data.goalId), eq(goals.userId, userId)),
    columns: { id: true },
  });
  if (!goal) return null;

  const [row] = await db
    .insert(progressUpdates)
    .values({ ...data, userId })
    .returning();
  return row;
}

export async function updateProgressUpdate(
  id: string,
  userId: string,
  data: Partial<Pick<NewProgressUpdate, "value" | "note" | "occurredAt">>
): Promise<ProgressUpdate | null> {
  // Scope the update through the goals join by using a subquery on ownership.
  const existing = await getProgressUpdateById(id, userId);
  if (!existing) return null;

  const [row] = await db
    .update(progressUpdates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(progressUpdates.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProgressUpdate(
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await getProgressUpdateById(id, userId);
  if (!existing) return false;
  const deleted = await db
    .delete(progressUpdates)
    .where(eq(progressUpdates.id, id))
    .returning({ id: progressUpdates.id });
  return deleted.length > 0;
}
