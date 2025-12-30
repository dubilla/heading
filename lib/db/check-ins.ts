import { db } from "@/lib/db";
import { checkIns, CheckIn, NewCheckIn } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getWeekStartDate } from "@/lib/utils/week-helpers";

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
