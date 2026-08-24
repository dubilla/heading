import { createMcpHandler } from "mcp-handler";
import { hashToken, resolveToken, TOKEN_PREFIX } from "@/lib/db/tokens";
import {
  clientIpFrom,
  isRateLimited,
  recordRateLimitEvent,
} from "@/lib/rate-limit";
import { registerTools } from "@/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MCP_RATE_LIMIT = 120;
const MCP_RATE_WINDOW_MS = 60 * 1000;

const FAILED_AUTH_LIMIT = 20;
const FAILED_AUTH_WINDOW_MS = 15 * 60 * 1000;

// JSON-RPC-shaped errors so MCP clients surface something legible instead of
// choking on a bare HTTP body.
function rpcError(status: number, code: number, message: string, headers = {}) {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }),
    {
      status,
      headers: { "content-type": "application/json", ...headers },
    }
  );
}

function unauthorized() {
  return rpcError(401, -32001, "Unauthorized", {
    "www-authenticate": `Bearer realm="heading"`,
  });
}

function rateLimited() {
  return rpcError(429, -32003, "Rate limit exceeded");
}

// RFC 7235 auth schemes are case-insensitive.
function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const separator = header.indexOf(" ");
  if (separator === -1) return null;
  if (header.slice(0, separator).toLowerCase() !== "bearer") return null;
  return header.slice(separator + 1).trim() || null;
}

/**
 * Hosted MCP endpoint. Personal access tokens only — the shared admin API key
 * and session cookies are deliberately not accepted here, so a browser session
 * can never be replayed into tool calls and a leaked admin key can't reach the
 * whole tool surface.
 */
export async function POST(request: Request) {
  // Anything that isn't shaped like a Heading token is rejected without
  // touching the database at all, so garbage traffic costs nothing.
  const token = bearerToken(request.headers.get("authorization"));
  if (!token || !token.startsWith(TOKEN_PREFIX)) return unauthorized();

  // Failed lookups are throttled per client, not per token: a token-guessing
  // client can mint a fresh token string per request, so a per-token bucket
  // would never fill.
  const ipBucket = `mcp-auth:${clientIpFrom(request.headers.get("x-forwarded-for"))}`;
  if (await isRateLimited(ipBucket, FAILED_AUTH_LIMIT, FAILED_AUTH_WINDOW_MS)) {
    return rateLimited();
  }

  const userId = await resolveToken(token);
  if (!userId) {
    await recordRateLimitEvent(ipBucket, FAILED_AUTH_WINDOW_MS);
    return unauthorized();
  }

  // Keyed by hash, not plaintext: the bucket is persisted to the database.
  const tokenBucket = `mcp:${hashToken(token)}`;
  if (await isRateLimited(tokenBucket, MCP_RATE_LIMIT, MCP_RATE_WINDOW_MS)) {
    return rateLimited();
  }
  await recordRateLimitEvent(tokenBucket, MCP_RATE_WINDOW_MS);

  const handler = createMcpHandler((server) => registerTools(server, userId), {
    serverInfo: { name: "heading", version: "0.1.0" },
  });

  return handler(request);
}

// Stateless: no SSE stream to resume and no session to terminate.
function methodNotAllowed() {
  return rpcError(405, -32000, "Method not allowed", { allow: "POST" });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
