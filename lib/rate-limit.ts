import { db } from "@/lib/db";
import { rateLimitEvents } from "@/lib/db/schema";
import { and, eq, gte, lt, count } from "drizzle-orm";

/**
 * Postgres-backed fixed-window rate limiter. Deliberately fails OPEN: a
 * database hiccup should degrade to "no throttling", never lock everyone out
 * of auth.
 */
export async function isRateLimited(
  bucket: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowMs);
    const [row] = await db
      .select({ value: count() })
      .from(rateLimitEvents)
      .where(
        and(
          eq(rateLimitEvents.bucket, bucket),
          gte(rateLimitEvents.createdAt, windowStart)
        )
      );
    return (row?.value ?? 0) >= limit;
  } catch (err) {
    console.error("Rate limit check failed (failing open):", err);
    return false;
  }
}

export async function recordRateLimitEvent(
  bucket: string,
  windowMs: number
): Promise<void> {
  try {
    await db.insert(rateLimitEvents).values({ bucket });
    // Opportunistic cleanup so the table never accumulates beyond one window
    // per bucket.
    const windowStart = new Date(Date.now() - windowMs);
    await db
      .delete(rateLimitEvents)
      .where(
        and(
          eq(rateLimitEvents.bucket, bucket),
          lt(rateLimitEvents.createdAt, windowStart)
        )
      );
  } catch (err) {
    console.error("Rate limit record failed:", err);
  }
}

export const AUTH_RATE_LIMIT = 5;
export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;

/** First hop of x-forwarded-for, or "unknown" off-proxy (dev). */
export function clientIpFrom(headerValue: string | null): string {
  return headerValue?.split(",")[0]?.trim() || "unknown";
}
