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

  // Allow API requests with admin API key, but only on the data API surface —
  // never account management (settings, password) or auth endpoints, so a
  // leaked key can't take over the account it impersonates. The handler
  // re-verifies the key (constant-time) in getAuthUserId.
  const adminKeyAllowedPrefixes = [
    "/api/goals",
    "/api/objectives",
    "/api/todos",
    "/api/milestones",
    "/api/check-ins",
    "/api/plan",
    "/api/crew",
  ];
  if (
    isApiRoute &&
    process.env.ADMIN_API_KEY &&
    adminKeyAllowedPrefixes.some((prefix) =>
      req.nextUrl.pathname.startsWith(prefix)
    )
  ) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.replace("Bearer ", "") === process.env.ADMIN_API_KEY) {
      return NextResponse.next();
    }
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
