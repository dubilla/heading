import type { Todo } from "@/lib/db/schema";

/**
 * Crew integration client. Crew is the hub / system-of-record for task content
 * and execution status; Heading pushes Heading-origin todos to Crew on create
 * and mirrors completion in both directions.
 *
 * Every call is best-effort: when the integration isn't configured (no env)
 * the client no-ops, and network/HTTP failures are logged but never thrown, so
 * Heading degrades gracefully when Crew is unreachable.
 *
 * Auth: `CREW_INTEGRATION_TOKEN` must equal Crew's `CREW_INTEGRATION_HEADING`
 * value (scope `write`, which also satisfies `read`).
 */

const EXTERNAL_SOURCE = "heading";

type CrewConfig = {
  apiUrl: string;
  token: string;
};

/**
 * Resolved Crew config, or null when the integration is off. Read at call time
 * (not module load) so missing env never crashes unrelated todo paths.
 */
export function crewConfig(): CrewConfig | null {
  const apiUrl = process.env.CREW_API_URL;
  const token = process.env.CREW_INTEGRATION_TOKEN;
  if (!apiUrl || !token) return null;
  return { apiUrl: apiUrl.replace(/\/$/, ""), token };
}

export function isCrewEnabled(): boolean {
  return crewConfig() !== null;
}

/** Crew compares dueDate as a plain `YYYY-MM-DD` string, so format the date. */
function toCrewDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Push a Heading todo to Crew, returning the linked Crew task id (or null if
 * the integration is off or the push failed). Idempotent on Crew's side via
 * `(externalSource, externalId)`, so retries return the existing task.
 *
 * `assignee: "user"` is required: it makes the task user-completable in Crew
 * and keeps Crew from handing it to an agent.
 */
export async function createCrewTask(todo: Todo): Promise<string | null> {
  const config = crewConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.apiUrl}/api/v1/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        title: todo.title,
        description: todo.description ?? undefined,
        dueDate: todo.dueDate ? toCrewDate(new Date(todo.dueDate)) : undefined,
        assignee: "user",
        externalSource: EXTERNAL_SOURCE,
        externalId: todo.id,
      }),
    });

    if (!response.ok) {
      console.error(`Crew task create failed with status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { task?: { id?: string } };
    return data.task?.id ?? null;
  } catch (err) {
    console.error("Crew task create failed:", err);
    return null;
  }
}

/** A Crew task as returned by the search endpoint (the fields we render/link). */
export type CrewTaskSummary = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  externalId: string | null;
  externalSource: string | null;
};

/**
 * Search existing Crew tasks by title (for linking an existing task to a goal).
 * Returns [] when the integration is off, the query is blank, or the call
 * fails — callers render an empty result rather than erroring.
 */
export async function searchCrewTasks(
  query: string
): Promise<CrewTaskSummary[]> {
  const config = crewConfig();
  if (!config || query.trim().length === 0) return [];

  try {
    const url = `${config.apiUrl}/api/v1/tasks?search=${encodeURIComponent(query.trim())}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!response.ok) {
      console.error(`Crew task search failed with status ${response.status}`);
      return [];
    }
    const data = (await response.json()) as { tasks?: CrewTaskSummary[] };
    return data.tasks ?? [];
  } catch (err) {
    console.error("Crew task search failed:", err);
    return [];
  }
}

/**
 * Adopt an existing Crew task into Heading by stamping it with our external
 * link, so Crew's completion write-back fires for it. Returns an outcome the
 * caller acts on: `ok` to proceed, `conflict` if the task is already linked
 * elsewhere (surface to the user), `error` for transient/unconfigured failures.
 */
export async function linkCrewTask(
  crewTaskId: string,
  headingTodoId: string
): Promise<"ok" | "conflict" | "error"> {
  const config = crewConfig();
  if (!config) return "error";

  try {
    const response = await fetch(
      `${config.apiUrl}/api/v1/tasks/${crewTaskId}/link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({
          externalSource: EXTERNAL_SOURCE,
          externalId: headingTodoId,
        }),
      }
    );
    if (response.ok) return "ok";
    if (response.status === 409) return "conflict";
    console.error(`Crew task link failed with status ${response.status}`);
    return "error";
  } catch (err) {
    console.error("Crew task link failed:", err);
    return "error";
  }
}

/**
 * Mirror a Heading-side completion to Crew. Best-effort and idempotent: Crew
 * returns 409 if the task is already complete, which we treat as benign.
 */
export async function completeCrewTask(crewTaskId: string): Promise<void> {
  const config = crewConfig();
  if (!config) return;

  try {
    const response = await fetch(
      `${config.apiUrl}/api/v1/tasks/${crewTaskId}/complete`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${config.token}` },
      }
    );
    // 409 = already complete (e.g. completion originated in Crew) — not a loop,
    // not an error worth surfacing.
    if (!response.ok && response.status !== 409) {
      console.error(`Crew task complete failed with status ${response.status}`);
    }
  } catch (err) {
    console.error("Crew task complete failed:", err);
  }
}
