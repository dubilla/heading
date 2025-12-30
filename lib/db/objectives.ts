import { db } from "@/lib/db";
import {
  objectives,
  goals,
  Objective,
  NewObjective,
  Goal,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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

  return { objective, goals: objectiveGoals };
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
      return { objective, goals: objectiveGoals };
    })
  );

  return results;
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
  const userObjectives = await getObjectivesByUserId(userId);
  const total = userObjectives.length;
  const completed = userObjectives.filter(
    (o) => o.status === "completed"
  ).length;
  const inProgress = userObjectives.filter(
    (o) => o.status === "in_progress" || o.status === "on_track"
  ).length;
  const offTrack = userObjectives.filter(
    (o) => o.status === "off_track"
  ).length;

  return { total, completed, inProgress, offTrack };
}
