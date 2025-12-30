import { db } from "@/lib/db";
import { milestones, goals, Milestone, NewMilestone } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getMilestonesByGoalId(
  goalId: string,
  userId: string
): Promise<Milestone[]> {
  // First verify the goal belongs to the user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return [];
  }

  return db.query.milestones.findMany({
    where: eq(milestones.goalId, goalId),
    orderBy: [asc(milestones.dueDate)],
  });
}

export async function getMilestoneById(
  id: string,
  userId: string
): Promise<Milestone | undefined> {
  const milestone = await db.query.milestones.findFirst({
    where: eq(milestones.id, id),
  });

  if (!milestone) {
    return undefined;
  }

  // Verify the goal belongs to the user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, milestone.goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return undefined;
  }

  return milestone;
}

export async function createMilestone(
  data: Omit<NewMilestone, "id" | "createdAt" | "updatedAt">,
  userId: string
): Promise<Milestone | null> {
  // Verify the goal belongs to the user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, data.goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return null;
  }

  const [milestone] = await db.insert(milestones).values(data).returning();
  return milestone;
}

export async function updateMilestone(
  id: string,
  userId: string,
  data: Partial<Omit<NewMilestone, "id" | "goalId" | "createdAt">>
): Promise<Milestone | null> {
  const existingMilestone = await getMilestoneById(id, userId);

  if (!existingMilestone) {
    return null;
  }

  const [milestone] = await db
    .update(milestones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(milestones.id, id))
    .returning();

  return milestone || null;
}

export async function deleteMilestone(
  id: string,
  userId: string
): Promise<boolean> {
  const existingMilestone = await getMilestoneById(id, userId);

  if (!existingMilestone) {
    return false;
  }

  const result = await db
    .delete(milestones)
    .where(eq(milestones.id, id))
    .returning({ id: milestones.id });

  return result.length > 0;
}

export async function getQuarterlyMilestones(
  goalId: string,
  userId: string
): Promise<Milestone[]> {
  const allMilestones = await getMilestonesByGoalId(goalId, userId);
  return allMilestones.filter((m) => m.type === "quarterly");
}

export async function getMonthlyMilestones(
  goalId: string,
  userId: string,
  quarter?: number
): Promise<Milestone[]> {
  const allMilestones = await getMilestonesByGoalId(goalId, userId);
  const monthly = allMilestones.filter((m) => m.type === "monthly");

  if (quarter) {
    const quarterMonths = getMonthsForQuarter(quarter);
    return monthly.filter((m) => m.month && quarterMonths.includes(m.month));
  }

  return monthly;
}

function getMonthsForQuarter(quarter: number): number[] {
  switch (quarter) {
    case 1:
      return [1, 2, 3];
    case 2:
      return [4, 5, 6];
    case 3:
      return [7, 8, 9];
    case 4:
      return [10, 11, 12];
    default:
      return [];
  }
}
