import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_USER_EMAIL = process.env.ADMIN_USER_EMAIL;

/**
 * Get the authenticated user ID from either NextAuth session or admin API key.
 *
 * For admin API key auth, looks up the user by ADMIN_USER_EMAIL.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  // Check NextAuth session first
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  // Fall back to admin API key
  if (!ADMIN_API_KEY) return null;

  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  if (token !== ADMIN_API_KEY) return null;

  // Look up the admin user
  if (!ADMIN_USER_EMAIL) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_USER_EMAIL),
  });

  return user?.id ?? null;
}
