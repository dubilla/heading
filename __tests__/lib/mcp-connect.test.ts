/**
 * @jest-environment node
 */
import { claudeCodeSnippet, claudeDesktopSnippet } from "@/lib/mcp-connect";
import { requestOrigin } from "@/lib/request-origin";
import { headers } from "next/headers";

jest.mock("next/headers", () => ({ headers: jest.fn() }));

function mockHeaders(values: Record<string, string>) {
  (headers as jest.Mock).mockResolvedValue({
    get: (key: string) => values[key] ?? null,
  });
}

describe("requestOrigin", () => {
  it("prefers the forwarded host and protocol behind a proxy", async () => {
    mockHeaders({
      host: "internal:3000",
      "x-forwarded-host": "heading.example.com",
      "x-forwarded-proto": "https",
    });

    expect(await requestOrigin()).toBe("https://heading.example.com");
  });

  it("falls back to the host header", async () => {
    mockHeaders({ host: "heading.example.com" });

    expect(await requestOrigin()).toBe("https://heading.example.com");
  });

  it("takes the first hop of a forwarded chain", async () => {
    mockHeaders({
      "x-forwarded-host": "heading.example.com, internal.vercel",
      "x-forwarded-proto": "https, http",
    });

    expect(await requestOrigin()).toBe("https://heading.example.com");
  });

  it.each([
    "localhost:3005",
    "127.0.0.1:3005",
    "192.168.1.20:3005",
    "mymachine.local:3005",
  ])("uses http for the local host %s", async (host) => {
    mockHeaders({ host });

    expect(await requestOrigin()).toBe(`http://${host}`);
  });

  it("never emits a null host", async () => {
    mockHeaders({});

    expect(await requestOrigin()).not.toContain("null");
  });
});

describe("snippets", () => {
  it("builds a runnable claude mcp add command", () => {
    expect(claudeCodeSnippet("https://heading.test", "hd_abc")).toBe(
      'claude mcp add --transport http heading https://heading.test/mcp --header "Authorization: Bearer hd_abc"'
    );
  });

  it("bridges Claude Desktop through mcp-remote, since it only launches stdio servers", () => {
    const parsed = JSON.parse(
      claudeDesktopSnippet("https://heading.test", "hd_abc")
    );

    expect(parsed.mcpServers.heading).toEqual({
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        "https://heading.test/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}",
      ],
      env: { AUTH_HEADER: "Bearer hd_abc" },
    });
  });

  it("keeps the token out of args, where unescaped spaces would mangle it", () => {
    const parsed = JSON.parse(
      claudeDesktopSnippet("https://heading.test", "hd_abc")
    );

    expect(parsed.mcpServers.heading.args.join(" ")).not.toContain("hd_abc");
    expect(parsed.mcpServers.heading.args).not.toContainEqual(
      expect.stringContaining(" ")
    );
  });
});
