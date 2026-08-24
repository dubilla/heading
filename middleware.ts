import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/error"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  // Allow all API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Machine-to-machine integration callbacks (e.g. Crew's completion webhook)
  // authenticate themselves with a shared secret inside the handler, so they
  // must bypass session-based redirects.
  if (req.nextUrl.pathname.startsWith("/api/integrations/")) {
    return NextResponse.next();
  }

  // The hosted MCP endpoint authenticates itself with a personal access token
  // inside the handler (and accepts nothing else), so it must bypass
  // session-based redirects.
  if (req.nextUrl.pathname === "/mcp") {
    return NextResponse.next();
  }

  // Allow token-authenticated requests (per-user personal access tokens and
  // the legacy admin API key) through to the handler, but only on the data API
  // surface — never account management (settings, password) or auth endpoints,
  // so a leaked token can't take over the account or mint more tokens. The
  // handler is the security gate: getAuthUserId verifies the token and returns
  // 401 if it's invalid, expired, or revoked.
  const tokenAuthAllowedPrefixes = [
    "/api/goals",
    "/api/objectives",
    "/api/todos",
    "/api/milestones",
    "/api/check-ins",
    "/api/plan",
    "/api/crew",
    "/api/dashboard",
  ];
  if (
    isApiRoute &&
    req.headers.get("authorization") &&
    tokenAuthAllowedPrefixes.some((prefix) =>
      req.nextUrl.pathname.startsWith(prefix)
    )
  ) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to signin for protected routes
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
