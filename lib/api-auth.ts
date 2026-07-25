import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { resolveToken, TOKEN_PREFIX } from "@/lib/db/tokens";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_USER_EMAIL = process.env.ADMIN_USER_EMAIL;

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/**
 * Get the authenticated user ID from either NextAuth session or admin API key.
 *
 * Session path: JWTs outlive account deletion, so the user row is confirmed to
 * still exist before the id is trusted.
 *
 * Personal access token path (per-user CLI/machine clients): a Bearer token
 * carrying the TOKEN_PREFIX is hashed and looked up; expiry is enforced there.
 *
 * Admin API key path (legacy shared machine key, e.g. Captain): requires both
 * ADMIN_API_KEY and ADMIN_USER_EMAIL, compared in constant time. The
 * middleware additionally restricts which API paths token clients can reach.
 */
export async function getAuthUserId(): Promise<string | null> {
  // Check NextAuth session first
  const session = await auth();
  if (session?.user?.id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true },
    });
    return user?.id ?? null;
  }

  // Fall back to a Bearer token
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  // Personal access tokens are self-identifying via their prefix.
  if (token.startsWith(TOKEN_PREFIX)) {
    return resolveToken(token);
  }

  // Legacy shared admin API key.
  if (!ADMIN_API_KEY || !ADMIN_USER_EMAIL) return null;
  if (!safeEqual(token, ADMIN_API_KEY)) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_USER_EMAIL),
  });

  return user?.id ?? null;
}
