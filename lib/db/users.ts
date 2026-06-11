import { db } from "@/lib/db";
import { users, User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function getUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function updateUserProfile(
  id: string,
  data: { name?: string; checkInDay?: number }
): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

export type ChangePasswordResult =
  | "ok"
  | "wrong_password"
  | "no_password"
  | "not_found";

/**
 * `no_password` covers OAuth-only accounts: they have nothing to verify
 * against, so password changes must go through the provider instead.
 */
export async function changeUserPassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const user = await getUserById(id);
  if (!user) return "not_found";
  if (!user.password) return "no_password";

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) return "wrong_password";

  const hashed = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(users.id, id));
  return "ok";
}
