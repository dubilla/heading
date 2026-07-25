import { createHash, randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { personalAccessTokens, PersonalAccessToken } from "@/lib/db/schema";

// All Heading tokens carry this prefix so secret-scanners can spot leaks and
// getAuthUserId can cheaply distinguish a PAT from the legacy admin key.
export const TOKEN_PREFIX = "hd_";

// Only refresh lastUsedAt once an hour, so a busy client doesn't cause a write
// on every request.
const LAST_USED_THROTTLE_MS = 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): {
  token: string;
  hash: string;
  last4: string;
} {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), last4: token.slice(-4) };
}

// Token metadata safe to return to clients — never includes the hash.
export type TokenSummary = Omit<PersonalAccessToken, "tokenHash">;

export async function createToken(params: {
  userId: string;
  name: string;
  expiresAt: Date | null;
}): Promise<{ token: string; record: TokenSummary }> {
  const { token, hash, last4 } = generateToken();
  const [record] = await db
    .insert(personalAccessTokens)
    .values({
      userId: params.userId,
      name: params.name,
      tokenHash: hash,
      last4,
      expiresAt: params.expiresAt,
    })
    .returning();
  // Map to the summary shape so the hash never leaves this layer.
  const summary: TokenSummary = {
    id: record.id,
    userId: record.userId,
    name: record.name,
    last4: record.last4,
    expiresAt: record.expiresAt,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
  };
  return { token, record: summary };
}

export async function listTokensByUserId(
  userId: string
): Promise<TokenSummary[]> {
  return db.query.personalAccessTokens.findMany({
    where: eq(personalAccessTokens.userId, userId),
    orderBy: [desc(personalAccessTokens.createdAt)],
    columns: { tokenHash: false },
  });
}

export async function deleteToken(
  id: string,
  userId: string
): Promise<boolean> {
  const deleted = await db
    .delete(personalAccessTokens)
    .where(
      and(
        eq(personalAccessTokens.id, id),
        eq(personalAccessTokens.userId, userId)
      )
    )
    .returning({ id: personalAccessTokens.id });
  return deleted.length > 0;
}

/**
 * Resolve a plaintext token to its owning user id, or null if the token is
 * malformed, unknown, or expired. Opportunistically refreshes lastUsedAt
 * (throttled) so the UI can show recency without a write per request.
 */
export async function resolveToken(token: string): Promise<string | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  const hash = hashToken(token);
  const record = await db.query.personalAccessTokens.findFirst({
    where: eq(personalAccessTokens.tokenHash, hash),
  });
  if (!record) return null;
  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) return null;

  const now = Date.now();
  if (
    !record.lastUsedAt ||
    now - record.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
  ) {
    await db
      .update(personalAccessTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(personalAccessTokens.id, record.id));
  }

  return record.userId;
}
