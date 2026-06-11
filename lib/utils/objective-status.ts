import type { Goal, Objective } from "@/lib/db/schema";

/**
 * An objective's status is derived from its goals rather than stored state —
 * the stored column drifted (it stayed "not_started" forever because nothing
 * wrote to it). Precedence: empty → not started; all complete → completed;
 * any off track → off track; any on track → on track; any other activity →
 * in progress.
 */
export function deriveObjectiveStatus(
  goalStatuses: Goal["status"][]
): Objective["status"] {
  if (goalStatuses.length === 0) return "not_started";
  if (goalStatuses.every((status) => status === "completed")) {
    return "completed";
  }
  if (goalStatuses.some((status) => status === "off_track")) {
    return "off_track";
  }
  if (goalStatuses.some((status) => status === "on_track")) {
    return "on_track";
  }
  if (goalStatuses.some((status) => status !== "not_started")) {
    return "in_progress";
  }
  return "not_started";
}
