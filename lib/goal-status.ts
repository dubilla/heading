import type { Goal } from "@/lib/db/schema";

export type GoalStatus = Goal["status"];

/**
 * The user-selectable goal statuses, in lifecycle order. Single source of
 * truth for the edit form and the quick-set menu. `not_started` is included
 * so a goal can be reset, but note it auto-advances to `in_progress` on the
 * first progress signal (see `markGoalStarted`).
 */
export const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_track", label: "On Track" },
  { value: "off_track", label: "Off Track" },
  { value: "completed", label: "Completed" },
];
