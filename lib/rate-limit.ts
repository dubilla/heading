import { db } from "@/lib/db";
import { rateLimitEvents } from "@/lib/db/schema";
import { and, eq, gte, lt, or, count, sql } from "drizzle-orm";

/**
 * Window boundaries come from the database clock, not the app's. created_at is
 * a naive timestamp, so a JS-side Date compares as UTC against a value Postgres
 * wrote in its own timezone — off by the server's offset, which silently
 * expires every row the moment it is written. Both sides must share one clock.
 */
function cutoff(agoMs: number) {
  return sql`now() - make_interval(secs => ${agoMs / 1000})`;
}

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
    const [row] = await db
      .select({ value: count() })
      .from(rateLimitEvents)
      .where(
        and(
          eq(rateLimitEvents.bucket, bucket),
          gte(rateLimitEvents.createdAt, cutoff(windowMs))
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
    // per bucket. Buckets an attacker can vary per request (a spoofed client
    // IP, say) are never revisited, so their rows are swept by age instead.
    await db
      .delete(rateLimitEvents)
      .where(
        or(
          and(
            eq(rateLimitEvents.bucket, bucket),
            lt(rateLimitEvents.createdAt, cutoff(windowMs))
          ),
          lt(rateLimitEvents.createdAt, cutoff(MAX_RETENTION_MS))
        )
      );
  } catch (err) {
    console.error("Rate limit record failed:", err);
  }
}

// No rate-limit window is longer than this, so older rows are dead weight.
const MAX_RETENTION_MS = 24 * 60 * 60 * 1000;

export const AUTH_RATE_LIMIT = 5;
export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;

/** First hop of x-forwarded-for, or "unknown" off-proxy (dev). */
export function clientIpFrom(headerValue: string | null): string {
  return headerValue?.split(",")[0]?.trim() || "unknown";
}
