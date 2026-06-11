import {
  isRateLimited,
  recordRateLimitEvent,
  clientIpFrom,
} from "@/lib/rate-limit";
import { db } from "@/lib/db";

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
