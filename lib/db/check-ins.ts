import { db } from "@/lib/db";
import { checkIns, CheckIn, NewCheckIn } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getWeekStartDate, isCurrentWeek } from "@/lib/utils/week-helpers";

export async function getCheckInsByUserId(userId: string): Promise<CheckIn[]> {
  return db.query.checkIns.findMany({
    where: eq(checkIns.userId, userId),
    orderBy: [desc(checkIns.weekStartDate)],
  });
}

export async function getCheckInById(
  id: string,
  userId: string
): Promise<CheckIn | undefined> {
  return db.query.checkIns.findFirst({
    where: and(eq(checkIns.id, id), eq(checkIns.userId, userId)),
  });
}

export async function getCheckInForWeek(
  userId: string,
  weekStartDate: Date
): Promise<CheckIn | undefined> {
  // Normalize the date to ensure consistent comparison
  const normalizedDate = new Date(weekStartDate);
  normalizedDate.setHours(0, 0, 0, 0);

  const allCheckIns = await getCheckInsByUserId(userId);

  return allCheckIns.find((checkIn) => {
    const checkInDate = new Date(checkIn.weekStartDate);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === normalizedDate.getTime();
  });
}

export async function getCurrentWeekCheckIn(
  userId: string
): Promise<CheckIn | undefined> {
  const currentWeekStart = getWeekStartDate();
  return getCheckInForWeek(userId, currentWeekStart);
}

export async function createCheckIn(
  data: Omit<NewCheckIn, "id" | "createdAt">
): Promise<CheckIn> {
  const [checkIn] = await db.insert(checkIns).values(data).returning();
  return checkIn;
}

export type UpdateCheckInData = {
  accomplishments: string;
  challenges: string;
  nextWeekPriorities: string;
  needsAdjustment: boolean;
};

/**
 * Amend a check-in, but only while its week is still the current one — past
 * reflections are immutable history. Returns the updated row, null when the
 * check-in doesn't exist (or isn't the caller's), or "not_current_week".
 */
export async function updateCurrentWeekCheckIn(
  id: string,
  userId: string,
  data: UpdateCheckInData
): Promise<CheckIn | "not_current_week" | null> {
  const existing = await getCheckInById(id, userId);
  if (!existing) return null;
  if (!isCurrentWeek(new Date(existing.weekStartDate))) {
    return "not_current_week";
  }

  const [updated] = await db
    .update(checkIns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(checkIns.id, id))
    .returning();
  return updated ?? null;
}

export async function getRecentCheckIns(
  userId: string,
  limit: number = 10
): Promise<CheckIn[]> {
  return db.query.checkIns.findMany({
    where: eq(checkIns.userId, userId),
    orderBy: [desc(checkIns.weekStartDate)],
    limit,
  });
}
