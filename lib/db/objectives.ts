import { db } from "@/lib/db";
import {
  objectives,
  goals,
  Objective,
  NewObjective,
  Goal,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { deriveObjectiveStatus } from "@/lib/utils/objective-status";

export async function getObjectivesByUserId(
  userId: string
): Promise<Objective[]> {
  return db.query.objectives.findMany({
    where: eq(objectives.userId, userId),
    orderBy: [desc(objectives.createdAt)],
  });
}

export async function getObjectiveById(
  id: string,
  userId: string
): Promise<Objective | undefined> {
  return db.query.objectives.findFirst({
    where: and(eq(objectives.id, id), eq(objectives.userId, userId)),
  });
}

export async function getObjectiveWithGoals(
  id: string,
  userId: string
): Promise<{ objective: Objective; goals: Goal[] } | null> {
  const objective = await getObjectiveById(id, userId);
  if (!objective) return null;

  const objectiveGoals = await db.query.goals.findMany({
    where: and(eq(goals.objectiveId, id), eq(goals.userId, userId)),
    orderBy: [desc(goals.createdAt)],
  });

  return {
    objective: withDerivedStatus(objective, objectiveGoals),
    goals: objectiveGoals,
  };
}

export async function getObjectivesWithGoals(
  userId: string
): Promise<{ objective: Objective; goals: Goal[] }[]> {
  const userObjectives = await getObjectivesByUserId(userId);

  const results = await Promise.all(
    userObjectives.map(async (objective) => {
      const objectiveGoals = await db.query.goals.findMany({
        where: and(
          eq(goals.objectiveId, objective.id),
          eq(goals.userId, userId)
        ),
        orderBy: [desc(goals.createdAt)],
      });
      return {
        objective: withDerivedStatus(objective, objectiveGoals),
        goals: objectiveGoals,
      };
    })
  );

  return results;
}

/**
 * The stored status column is vestigial (nothing ever wrote to it after
 * creation); every read path that has the goals available reports the derived
 * status instead.
 */
function withDerivedStatus(
  objective: Objective,
  objectiveGoals: Goal[]
): Objective {
  return {
    ...objective,
    status: deriveObjectiveStatus(objectiveGoals.map((g) => g.status)),
  };
}

export async function createObjective(
  data: Omit<NewObjective, "id" | "createdAt" | "updatedAt">
): Promise<Objective> {
  const [objective] = await db.insert(objectives).values(data).returning();
  return objective;
}

export async function updateObjective(
  id: string,
  userId: string,
  data: Partial<Omit<NewObjective, "id" | "userId" | "createdAt">>
): Promise<Objective | null> {
  const [objective] = await db
    .update(objectives)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(objectives.id, id), eq(objectives.userId, userId)))
    .returning();
  return objective || null;
}

export async function deleteObjective(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(objectives)
    .where(and(eq(objectives.id, id), eq(objectives.userId, userId)))
    .returning({ id: objectives.id });
  return result.length > 0;
}

export async function getObjectiveStats(userId: string) {
  const withGoals = await getObjectivesWithGoals(userId);
  const statuses = withGoals.map(({ objective }) => objective.status);

  const total = statuses.length;
  const completed = statuses.filter((s) => s === "completed").length;
  const inProgress = statuses.filter(
    (s) => s === "in_progress" || s === "on_track"
  ).length;
  const offTrack = statuses.filter((s) => s === "off_track").length;

  return { total, completed, inProgress, offTrack };
}
