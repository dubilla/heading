import {
  isRateLimited,
  recordRateLimitEvent,
  clientIpFrom,
} from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { PgDialect } from "drizzle-orm/pg-core";

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
};

function mockCount(value: number) {
  mockDb.select.mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ value }]),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.insert.mockReturnValue({
    values: jest.fn().mockResolvedValue(undefined),
  });
  mockDb.delete.mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  });
});

describe("isRateLimited", () => {
  it("allows requests under the limit", async () => {
    mockCount(4);
    expect(await isRateLimited("signin:a@b.c", 5, 60_000)).toBe(false);
  });

  it("throttles requests at the limit", async () => {
    mockCount(5);
    expect(await isRateLimited("signin:a@b.c", 5, 60_000)).toBe(true);
  });

  it("fails open when the database errors", async () => {
    mockDb.select.mockImplementation(() => {
      throw new Error("connection refused");
    });
    expect(await isRateLimited("signin:a@b.c", 5, 60_000)).toBe(false);
  });
});

describe("recordRateLimitEvent", () => {
  it("inserts an event and prunes expired ones", async () => {
    await recordRateLimitEvent("signup:1.2.3.4", 60_000);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("also prunes by age, so one-shot buckets can't accumulate", async () => {
    const where = jest.fn().mockResolvedValue(undefined);
    mockDb.delete.mockReturnValue({ where });

    await recordRateLimitEvent("mcp-auth:1.2.3.4", 60_000);

    const { sql, params } = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    // Bucket-scoped window prune OR'd with an unscoped retention sweep.
    expect(sql).toMatch(/\bor\b/i);
    expect(sql.match(/"created_at" </g)).toHaveLength(2);
    const seconds = (params.filter((p) => typeof p === "number") as number[])
      .slice()
      .sort((a, b) => a - b);
    expect(seconds).toEqual([60, 24 * 60 * 60]);
  });

  it("measures windows with the database clock, not the app's", async () => {
    // created_at is a naive timestamp: a JS-side Date would compare as UTC
    // against whatever timezone Postgres wrote, expiring every row on write.
    const where = jest.fn().mockResolvedValue([{ value: 0 }]);
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({ where }),
    });

    await isRateLimited("signin:a@b.c", 5, 60_000);

    const { sql, params } = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(sql).toContain("now()");
    expect(params).not.toContainEqual(expect.any(Date));
  });

  it("swallows database errors", async () => {
    mockDb.insert.mockImplementation(() => {
      throw new Error("connection refused");
    });
    await expect(
      recordRateLimitEvent("signup:1.2.3.4", 60_000)
    ).resolves.toBeUndefined();
  });
});

describe("clientIpFrom", () => {
  it("takes the first forwarded hop", () => {
    expect(clientIpFrom("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7");
  });

  it("falls back to unknown", () => {
    expect(clientIpFrom(null)).toBe("unknown");
    expect(clientIpFrom("")).toBe("unknown");
  });
});
