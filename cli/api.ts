import { resolveConfig } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function requireAuth(): { apiUrl: string; token: string } {
  const { apiUrl, token } = resolveConfig();
  if (!apiUrl || !token) {
    throw new ApiError(
      "Not authenticated. Run `heading login`, or set HEADING_API_URL and HEADING_TOKEN.",
      401
    );
  }
  return { apiUrl: apiUrl.replace(/\/$/, ""), token };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const { apiUrl, token } = requireAuth();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(`Could not reach the API at ${apiUrl}.`, 0);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      payload.error || `Request failed (${response.status}).`,
      response.status
    );
  }
  return payload.data as T;
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body: unknown) =>
  request<T>("POST", path, body);
export const apiPatch = <T>(path: string, body: unknown) =>
  request<T>("PATCH", path, body);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
