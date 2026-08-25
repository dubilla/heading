# Hosted MCP at /mcp - Backlog

## Overview

Ship a hosted, Streamable HTTP MCP endpoint at `POST /mcp` so any MCP client (Claude Code, Claude Desktop, the API) can read and update objectives, goals, milestones, todos, and progress updates against the deployed app — authenticated with the existing personal access tokens, with no local checkout or `HEADING_USER_ID` env var.

Almost everything already exists and gets reused, not rebuilt:

- `mcp/server.ts` — a complete stdio MCP server with 24 tools covering objectives, goals, milestones, todos, progress updates, and the dashboard. All tool handlers already take an explicit userId through the db layer.
- `lib/api-auth.ts` + `lib/db/tokens.ts` — Bearer personal access tokens (`hd_` prefix, hashed lookup, expiry/revocation enforced in `resolveToken()`), minted from the Settings → Tokens UI.
- `lib/rate-limit.ts` — existing rate limiter.

Decisions already made (do not relitigate):

- **Transport**: `mcp-handler` (Vercel's official MCP adapter for the App Router), run stateless — fresh server per POST, no Redis, no SSE session state. Only fall back to hand-rolling the SDK's `StreamableHTTPServerTransport` if `mcp-handler` genuinely can't be made to work; note why in the commit if so.
- **Auth**: personal access tokens only on this surface. The legacy shared admin API key is deliberately _not_ accepted at `/mcp`. OAuth (needed for claude.ai web custom connectors) is a non-goal; Claude Code/Desktop/API all send custom headers.
- **One tool surface**: stdio and HTTP share the same tool registrations. No forked tool lists.

Conventions: follow the repo's testing patterns in `__tests__/`, run `npm run typecheck && npm run lint && npm test` before each commit, and keep comments to the existing near-zero density. Each slice is one commit/PR-sized unit that leaves the app deployable.

---

### [x] ✅ Slice M1: The Hosted /mcp Endpoint Works End-to-End With a Personal Access Token _(PR #43, merged Aug 25 2026)_

**User Value**: The user can point an MCP client at `https://<host>/mcp` with a token from Settings → Tokens and list/read/update all their Heading data remotely — verifiable with a curl `tools/list` and a `list_goals` tool call against the running dev server.

**Work**:

- Refactor: Extract every `server.tool(...)` registration from `mcp/server.ts` into `mcp/tools.ts` exporting `registerTools(server: McpServer, userId: string)`. `mcp/server.ts` becomes a thin stdio entrypoint: read `HEADING_USER_ID`, build an `McpServer`, call `registerTools`, connect stdio transport. Behavior of `npm run mcp` is unchanged.
- Dependency: Add `mcp-handler`.
- API: New `app/mcp/route.ts` exposing `POST /mcp` via `mcp-handler` in stateless mode, calling `registerTools(server, userId)` per request. `GET` and `DELETE` return 405 (no session resumption).
- Auth: Before dispatching to the handler, read the `Authorization` header; require the `TOKEN_PREFIX` (`hd_`) form and resolve it with `resolveToken()`. Missing/invalid/expired/revoked token → 401 with a `WWW-Authenticate: Bearer` header and no MCP processing. Do not accept the admin API key or session cookies here. Reuse `lib/rate-limit.ts`, keyed by token, before token resolution.
- Middleware: `/mcp` is outside `/api/`, so `middleware.ts` currently redirects it to sign-in. Add a bypass for `/mcp` in the same style (and adjacent to) the `/api/integrations/` bypass — the route handler is the security gate.
- Tests:
  - No `Authorization` header → 401; malformed token, wrong prefix, expired token, revoked token → 401.
  - Valid token → JSON-RPC `tools/list` returns all 24 tools.
  - Valid token → `tools/call` on `list_goals` returns only that token owner's goals.
  - Cross-user isolation regression guard: user A's token calling `get_goal` with user B's goal UUID returns the not-found error, not the goal.
  - Existing stdio-path tests (if any) still pass against the extracted `registerTools`.

**Definition of Done**: With the dev server running, `curl -X POST http://localhost:3005/mcp -H "Authorization: Bearer hd_..."` with a `tools/list` JSON-RPC body returns the tool catalog; the same call without a valid token returns 401; a real tool call round-trips scoped to the token's user; `npm run mcp` stdio server still works; typecheck, lint, and tests pass.

---

### [x] ✅ Slice M2: Settings → Tokens Shows How to Connect an MCP Client _(PR #44, merged Aug 25 2026)_

**User Value**: After minting a token, the user sees exactly how to connect — a copyable `claude mcp add --transport http heading <origin>/mcp --header "Authorization: Bearer <token>"` command and the equivalent Claude Desktop JSON — with the deployed origin filled in. The feature is discoverable and self-serve, not tribal knowledge.

**Work**:

- UI: On the Settings → Tokens page, add a "Connect an MCP client" section rendered when at least one token exists, and surface it prominently in the one moment the plaintext token is visible (immediately after creation) with the real token substituted into the snippets; afterwards show the snippets with a `hd_...` placeholder.
- UI: Copy-to-clipboard on each snippet, matching how the token value itself is presented today. Derive the origin from the request/environment rather than hardcoding a domain, so it's correct in dev, preview, and production.
- Docs: Short "Remote MCP" section in `README.md`: what `/mcp` is, PAT auth, the two client snippets, and the note that claude.ai web custom connectors (OAuth-only) are unsupported.
- Tests: Tokens page renders the connect section with the correct origin; post-creation state embeds the plaintext token in the snippet; steady state shows the placeholder.

**Definition of Done**: A user who has never read the code can mint a token on Settings → Tokens and connect Claude Code or Claude Desktop to the hosted MCP by copy-paste alone; typecheck, lint, and tests pass.

---

## Status (August 25, 2026)

Both slices are **merged to main**. The only step left is manual and Dan-only: mint a production token on Settings → Tokens and point a client at it.

Remaining ideas are under _Out of scope / follow-ups_ below — none are committed work.

## Deploying

There is nothing to configure. Specifically:

- **No new environment variables.** The only `process.env` read in the MCP code is `HEADING_USER_ID` in `mcp/server.ts`, which is the local stdio entrypoint — it must _not_ be set in production. The HTTP path derives the user from the Bearer token per request.
- **No new migrations.** `rate_limit_events` (`0006`) and `personal_access_tokens` (`0007`) already exist, and `npm run build` runs `drizzle-kit migrate` anyway.
- **No origin configuration.** `requestOrigin()` reads `x-forwarded-host`/`x-forwarded-proto`, so the Settings snippets are correct on production and on every preview deployment without a `NEXTAUTH_URL`-style variable to keep in sync.

Two things to know rather than do:

- **The `/mcp` bypass in `middleware.ts` is load-bearing.** `/mcp` is outside `/api/`, so without it the endpoint redirects to sign-in. Next 16 warns that the `middleware` convention is deprecated in favour of `proxy`; that rename must carry the bypass across.
- **Token expiry defaults to 30 days.** A long-lived MCP client connection silently stops working after a month. Pick a longer option deliberately when minting the token you actually use.

## Decisions made while building (don't relitigate)

- **`mcp-handler` v2 sits on `@modelcontextprotocol/server` v2, not `@modelcontextprotocol/sdk` v1**, and that `McpServer` has no `.tool()` — only `registerTool`. Rather than pin `mcp-handler@1` (exact old SDK peer, plus a Redis dependency), `mcp/` moved to the v2 package and all registrations converted. The v1 SDK was only used in `mcp/` and is dropped.
- **Claude Desktop cannot consume a `type: "http"` config entry.** It only launches stdio servers from `claude_desktop_config.json`; remote servers there go through the Connectors UI, which is OAuth-only and so can't reach this endpoint. The Desktop snippet bridges through `mcp-remote`, with the header value carried in `env` because several clients don't escape spaces inside `args`.
- **There are 24 tools, not the 18 this document originally claimed.** Tests assert 24.

## Fixed along the way (unrelated to MCP)

`lib/rate-limit.ts` had never worked on a non-UTC server. `rate_limit_events.created_at` is a naive `timestamp`, so Postgres wrote local time while Drizzle read it back as UTC; every row looked expired the moment it was written, which deleted it on the next write and made `isRateLimited` always count zero — **sign-in brute-force throttling was silently dead**. Window boundaries now come from the database clock (no migration needed), and rows are also swept by age. Shipped in #43; pull it into its own PR if that bundling is unwelcome. Vercel runs UTC, so production was unaffected — but throttling now genuinely enforces its limits.

## Out of scope / follow-ups (do not build now)

- **OAuth for claude.ai web custom connectors** — a real slice of its own (MCP auth spec discovery endpoints against next-auth). Revisit only if claude.ai web connectivity becomes a need.
- **Session/SSE (stateful) transport** — stateless covers fast DB-backed tools; no streaming or resumability need.
- **Retiring the stdio server** — keep it; after Slice M1 it's a thin wrapper and costs nothing.
- **Per-token scopes (read-only tokens)** — worth considering once a second user or third-party client exists.
