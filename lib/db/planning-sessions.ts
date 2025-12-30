import { db } from "@/lib/db";
import { planningSessions, goals, PlanningSession } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getActiveSession(
  goalId: string,
  userId: string
): Promise<PlanningSession | undefined> {
  // First verify the goal belongs to the user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return undefined;
  }

  return db.query.planningSessions.findFirst({
    where: and(
      eq(planningSessions.goalId, goalId),
      eq(planningSessions.userId, userId),
      eq(planningSessions.status, "active")
    ),
    orderBy: [desc(planningSessions.createdAt)],
  });
}

export async function getSessionById(
  id: string,
  userId: string
): Promise<PlanningSession | undefined> {
  const session = await db.query.planningSessions.findFirst({
    where: and(
      eq(planningSessions.id, id),
      eq(planningSessions.userId, userId)
    ),
  });

  return session;
}

export async function createSession(
  goalId: string,
  userId: string
): Promise<PlanningSession | null> {
  // Verify goal belongs to user
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    return null;
  }

  // Abandon any existing active sessions for this goal
  await db
    .update(planningSessions)
    .set({ status: "abandoned", updatedAt: new Date() })
    .where(
      and(
        eq(planningSessions.goalId, goalId),
        eq(planningSessions.userId, userId),
        eq(planningSessions.status, "active")
      )
    );

  const [session] = await db
    .insert(planningSessions)
    .values({
      goalId,
      userId,
      messages: [],
      status: "active",
    })
    .returning();

  return session;
}

export async function updateSessionMessages(
  id: string,
  userId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<PlanningSession | null> {
  const session = await getSessionById(id, userId);

  if (!session) {
    return null;
  }

  const [updated] = await db
    .update(planningSessions)
    .set({ messages, updatedAt: new Date() })
    .where(eq(planningSessions.id, id))
    .returning();

  return updated || null;
}

export async function completeSession(
  id: string,
  userId: string
): Promise<PlanningSession | null> {
  const session = await getSessionById(id, userId);

  if (!session) {
    return null;
  }

  const [updated] = await db
    .update(planningSessions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(planningSessions.id, id))
    .returning();

  return updated || null;
}
