import {
  generateToken,
  hashToken,
  resolveToken,
  TOKEN_PREFIX,
} from "@/lib/db/tokens";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      personalAccessTokens: { findFirst: jest.fn() },
    },
    update: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  query: { personalAccessTokens: { findFirst: jest.Mock } };
  update: jest.Mock;
};

function mockUpdate() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });
  mockDb.update.mockReturnValue({ set });
  return { set, where };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("generateToken / hashToken", () => {
  it("mints a prefixed token whose stored hash and last4 match the plaintext", () => {
    const { token, hash, last4 } = generateToken();

    expect(token.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(hash).toBe(hashToken(token));
    expect(last4).toBe(token.slice(-4));
    // Never store the plaintext; the hash must not contain it.
    expect(hash).not.toContain(token);
  });

  it("produces distinct tokens across calls", () => {
    expect(generateToken().token).not.toBe(generateToken().token);
  });

  it("hashes deterministically", () => {
    expect(hashToken("hd_abc")).toBe(hashToken("hd_abc"));
    expect(hashToken("hd_abc")).not.toBe(hashToken("hd_abd"));
  });
});

describe("resolveToken", () => {
  it("rejects a token without the Heading prefix without hitting the db", async () => {
    const result = await resolveToken("nope_deadbeef");

    expect(result).toBeNull();
    expect(mockDb.query.personalAccessTokens.findFirst).not.toHaveBeenCalled();
  });

  it("returns null for an unknown token", async () => {
    mockDb.query.personalAccessTokens.findFirst.mockResolvedValue(undefined);

    expect(await resolveToken("hd_unknown")).toBeNull();
  });

  it("returns null for an expired token and does not touch lastUsedAt", async () => {
    mockDb.query.personalAccessTokens.findFirst.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1000),
      lastUsedAt: null,
    });

    expect(await resolveToken("hd_expired")).toBeNull();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("resolves a valid token to its user and refreshes lastUsedAt", async () => {
    const { where } = mockUpdate();
    mockDb.query.personalAccessTokens.findFirst.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: null,
    });

    expect(await resolveToken("hd_valid")).toBe("user-1");
    expect(mockDb.update).toHaveBeenCalled();
    expect(where).toHaveBeenCalled();
  });

  it("treats a null expiry as non-expiring", async () => {
    mockUpdate();
    mockDb.query.personalAccessTokens.findFirst.mockResolvedValue({
      id: "tok-2",
      userId: "user-2",
      expiresAt: null,
      lastUsedAt: null,
    });

    expect(await resolveToken("hd_forever")).toBe("user-2");
  });

  it("skips the lastUsedAt write when it was refreshed recently", async () => {
    mockUpdate();
    mockDb.query.personalAccessTokens.findFirst.mockResolvedValue({
      id: "tok-3",
      userId: "user-3",
      expiresAt: null,
      lastUsedAt: new Date(Date.now() - 1000),
    });

    expect(await resolveToken("hd_recent")).toBe("user-3");
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
