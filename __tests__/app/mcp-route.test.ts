/**
 * @jest-environment node
 */
import { POST, GET, DELETE } from "@/app/mcp/route";
import { resolveToken } from "@/lib/db/tokens";
import { isRateLimited, recordRateLimitEvent } from "@/lib/rate-limit";
import { getGoalsByUserId, getGoalById } from "@/lib/db/goals";

jest.mock("@/lib/db", () => ({ db: {} }));

jest.mock("@/lib/db/tokens", () => ({
  ...jest.requireActual("@/lib/db/tokens"),
  resolveToken: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  ...jest.requireActual("@/lib/rate-limit"),
  isRateLimited: jest.fn(),
  recordRateLimitEvent: jest.fn(),
}));

jest.mock("@/lib/db/objectives", () => ({
  getObjectivesByUserId: jest.fn(),
  getObjectiveWithGoals: jest.fn(),
  getObjectivesWithGoals: jest.fn(),
  createObjective: jest.fn(),
  updateObjective: jest.fn(),
  deleteObjective: jest.fn(),
  getObjectiveStats: jest.fn(),
}));
jest.mock("@/lib/db/goals", () => ({
  getGoalsByUserId: jest.fn(),
  getGoalById: jest.fn(),
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
  deleteGoal: jest.fn(),
  getGoalStats: jest.fn(),
}));
jest.mock("@/lib/db/milestones", () => ({
  getMilestonesByGoalId: jest.fn(),
  createMilestone: jest.fn(),
  updateMilestone: jest.fn(),
  deleteMilestone: jest.fn(),
}));
jest.mock("@/lib/db/todos", () => ({
  getTodosByUserId: jest.fn(),
  getTodosByGoalId: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
  getTodoStats: jest.fn(),
}));
jest.mock("@/lib/db/progress-updates", () => ({
  createProgressUpdate: jest.fn(),
  deleteProgressUpdate: jest.fn(),
  getLatestProgressUpdateForGoal: jest.fn(),
  getProgressUpdatesByGoalId: jest.fn(),
  updateProgressUpdate: jest.fn(),
}));

const mockResolveToken = resolveToken as jest.Mock;
const mockIsRateLimited = isRateLimited as jest.Mock;
const mockGetGoalsByUserId = getGoalsByUserId as jest.Mock;
const mockGetGoalById = getGoalById as jest.Mock;

const VALID_TOKEN = "hd_valid-token-for-user-a";
const USER_A = "user-a";

function post(body: unknown, authorization?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "x-forwarded-for": "203.0.113.7",
  };
  if (authorization) headers.authorization = authorization;
  return POST(
    new Request("http://localhost:3005/mcp", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  );
}

/** Streamable HTTP may answer as JSON or as a one-shot SSE stream. */
async function readRpc(res: Response) {
  const text = await res.text();
  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    const line = text
      .split("\n")
      .find((l) => l.startsWith("data:"))
      ?.slice("data:".length);
    return JSON.parse(line ?? "null");
  }
  return JSON.parse(text);
}

const INITIALIZE = {
  jsonrpc: "2.0",
  id: 0,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsRateLimited.mockResolvedValue(false);
  (recordRateLimitEvent as jest.Mock).mockResolvedValue(undefined);
  mockResolveToken.mockResolvedValue(USER_A);
});

describe("POST /mcp authentication", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await post(INITIALIZE);

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
    expect(mockResolveToken).not.toHaveBeenCalled();
  });

  it.each([
    ["a malformed header", "not-a-bearer-token"],
    ["a bearer token without the Heading prefix", "Bearer sk-some-other-key"],
    ["an empty bearer token", "Bearer "],
  ])("rejects %s without touching the database", async (_label, header) => {
    const res = await post(INITIALIZE, header);

    expect(res.status).toBe(401);
    expect(mockResolveToken).not.toHaveBeenCalled();
  });

  // resolveToken collapses unknown, expired, and revoked tokens to null.
  it("rejects a well-formed token that does not resolve to a user", async () => {
    mockResolveToken.mockResolvedValue(null);

    const res = await post(INITIALIZE, `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
  });

  it("does not accept the shared admin API key", async () => {
    const res = await post(INITIALIZE, "Bearer admin-api-key-value");

    expect(res.status).toBe(401);
    expect(mockResolveToken).not.toHaveBeenCalled();
  });

  it("accepts a lowercase bearer scheme", async () => {
    const res = await post(INITIALIZE, `bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(mockResolveToken).toHaveBeenCalledWith(VALID_TOKEN);
  });
});

describe("POST /mcp rate limiting", () => {
  it("charges a failed lookup to the client, not the token", async () => {
    // A token-guessing client can vary the token per request, so a per-token
    // bucket would never fill and would grow the events table without bound.
    mockResolveToken.mockResolvedValue(null);

    const res = await post(INITIALIZE, `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(401);
    const [bucket] = (recordRateLimitEvent as jest.Mock).mock.calls[0];
    expect(bucket).toBe("mcp-auth:203.0.113.7");
  });

  it("rejects a client that has exhausted its failed-lookup budget", async () => {
    mockIsRateLimited.mockResolvedValue(true);

    const res = await post(INITIALIZE, `Bearer ${VALID_TOKEN}`);

    expect(res.status).toBe(429);
    expect(mockResolveToken).not.toHaveBeenCalled();
    expect(mockIsRateLimited.mock.calls[0][0]).toBe("mcp-auth:203.0.113.7");
  });

  it("never writes a rate-limit row for a token it does not have to look up", async () => {
    const res = await post(INITIALIZE, "Bearer sk-not-a-heading-token");

    expect(res.status).toBe(401);
    expect(mockIsRateLimited).not.toHaveBeenCalled();
    expect(recordRateLimitEvent).not.toHaveBeenCalled();
  });

  it("meters authenticated traffic per token, hashed", async () => {
    await post(INITIALIZE, `Bearer ${VALID_TOKEN}`);

    const [bucket] = (recordRateLimitEvent as jest.Mock).mock.calls[0];
    expect(bucket).toMatch(/^mcp:[0-9a-f]{64}$/);
    expect(bucket).not.toContain(VALID_TOKEN);
  });
});

describe("POST /mcp tool surface", () => {
  it("lists the full tool catalog for a valid token", async () => {
    await post(INITIALIZE, `Bearer ${VALID_TOKEN}`);
    const res = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
      `Bearer ${VALID_TOKEN}`
    );

    expect(res.status).toBe(200);
    const body = await readRpc(res);
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("list_goals");
    expect(names).toContain("get_dashboard");
    expect(names).toContain("create_progress_update");
    // Every tool registered on the stdio server is reachable over HTTP.
    expect(names).toHaveLength(24);
  });

  it("scopes list_goals to the token owner", async () => {
    mockGetGoalsByUserId.mockResolvedValue([{ id: "goal-1", title: "Ship" }]);

    const res = await post(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "list_goals", arguments: {} },
      },
      `Bearer ${VALID_TOKEN}`
    );

    expect(res.status).toBe(200);
    expect(mockGetGoalsByUserId).toHaveBeenCalledWith(USER_A);
    const body = await readRpc(res);
    expect(body.result.content[0].text).toContain("Ship");
  });

  it("does not leak another user's goal through get_goal", async () => {
    // The db layer scopes by userId, so user B's goal is invisible to user A.
    mockGetGoalById.mockImplementation(async (id: string, userId: string) =>
      userId === "user-b" ? { id } : null
    );

    const res = await post(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_goal", arguments: { id: "goal-b" } },
      },
      `Bearer ${VALID_TOKEN}`
    );

    const body = await readRpc(res);
    expect(mockGetGoalById).toHaveBeenCalledWith("goal-b", USER_A);
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("not found");
  });
});

describe("/mcp non-POST methods", () => {
  it("returns 405 for GET and DELETE", () => {
    for (const res of [GET(), DELETE()]) {
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("POST");
    }
  });
});
