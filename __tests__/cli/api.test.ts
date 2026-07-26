import { apiGet, apiPost, apiDelete, ApiError } from "@/cli/api";
import { resolveConfig } from "@/cli/config";

jest.mock("@/cli/config", () => ({
  resolveConfig: jest.fn(),
}));

const mockResolve = resolveConfig as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockResolve.mockReturnValue({ apiUrl: "https://api.test", token: "hd_x" });
  global.fetch = jest.fn();
});

describe("api client", () => {
  it("throws a 401 ApiError when not authenticated, without calling fetch", async () => {
    mockResolve.mockReturnValue({});
    await expect(apiGet("/api/goals")).rejects.toMatchObject({ status: 401 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the bearer token and unwraps data on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "1" }] }),
    });

    const result = await apiGet("/api/goals");

    expect(result).toEqual([{ id: "1" }]);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.test/api/goals");
    expect(init.headers.Authorization).toBe("Bearer hd_x");
  });

  it("strips a trailing slash from the configured api url", async () => {
    mockResolve.mockReturnValue({ apiUrl: "https://api.test/", token: "hd_x" });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });

    await apiGet("/api/goals");

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      "https://api.test/api/goals"
    );
  });

  it("sends a JSON body and content-type on POST", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "1" } }),
    });

    await apiPost("/api/goals", { title: "x" });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "x" }));
  });

  it("maps an error response to an ApiError carrying the server message and status", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Goal not found" }),
    });

    await expect(apiDelete("/api/goals/1")).rejects.toMatchObject({
      message: "Goal not found",
      status: 404,
    });
  });

  it("wraps a network failure in an ApiError", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(apiGet("/api/goals")).rejects.toBeInstanceOf(ApiError);
  });
});
