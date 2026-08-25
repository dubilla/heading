import { headers } from "next/headers";

// Proxy headers can carry a comma-separated chain; the first hop is the client-facing one.
function firstHop(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function isLocal(host: string): boolean {
  const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
  );
}

/** Public origin of the current request, so snippets work in dev and preview. */
export async function requestOrigin(): Promise<string> {
  const headersList = await headers();
  const host =
    firstHop(headersList.get("x-forwarded-host")) ??
    firstHop(headersList.get("host")) ??
    "localhost:3005";
  const proto =
    firstHop(headersList.get("x-forwarded-proto")) ??
    (isLocal(host) ? "http" : "https");
  return `${proto}://${host}`;
}
