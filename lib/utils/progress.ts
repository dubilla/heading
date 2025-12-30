import type { Goal, Milestone, Todo } from "@/lib/db/schema";

export interface ProgressResult {
  actual: number;
  expected: number;
  status:
    | "not_started"
    | "in_progress"
    | "on_track"
    | "at_risk"
    | "off_track"
    | "completed";
}

export function calculateProgress(total: number, completed: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calculateExpectedProgress(
  startDate: Date,
  targetDate: Date,
  currentDate: Date = new Date()
): number {
  const start = startDate.getTime();
  const target = targetDate.getTime();
  const current = currentDate.getTime();

  if (current <= start) return 0;
  if (current >= target) return 100;

  const totalDuration = target - start;
  const elapsed = current - start;

  return Math.round((elapsed / totalDuration) * 100);
}

export function determineStatus(
  actualProgress: number,
  expectedProgress: number,
  totalTodos: number
): ProgressResult["status"] {
  if (totalTodos === 0) return "not_started";
  if (actualProgress === 100) return "completed";
  if (actualProgress === 0) return "not_started";
  if (actualProgress >= expectedProgress - 10) return "on_track";
  if (actualProgress >= expectedProgress - 25) return "at_risk";
  return "off_track";
}

export function calculateGoalProgress(
  goal: Goal,
  todos: Todo[]
): ProgressResult {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;

  const actual = calculateProgress(total, completed);
  const expected = calculateExpectedProgress(
    new Date(goal.createdAt),
    new Date(goal.targetDate)
  );
  const status = determineStatus(actual, expected, total);

  return { actual, expected, status };
}

export function calculateMilestoneProgress(
  milestone: Milestone,
  todos: Todo[]
): ProgressResult {
  const milestoneTodos = todos.filter((t) => t.milestoneId === milestone.id);
  const total = milestoneTodos.length;
  const completed = milestoneTodos.filter((t) => t.completed).length;

  const actual = calculateProgress(total, completed);

  // For milestones, expected progress is based on due date
  const startDate = new Date(milestone.createdAt);
  const expected = calculateExpectedProgress(
    startDate,
    new Date(milestone.dueDate)
  );
  const status = determineStatus(actual, expected, total);

  return { actual, expected, status };
}

export function getStatusColor(status: ProgressResult["status"]): string {
  switch (status) {
    case "completed":
      return "bg-purple-500";
    case "on_track":
      return "bg-green-500";
    case "at_risk":
      return "bg-yellow-500";
    case "off_track":
      return "bg-red-500";
    case "in_progress":
      return "bg-blue-500";
    default:
      return "bg-gray-300";
  }
}

export function getStatusTextColor(status: ProgressResult["status"]): string {
  switch (status) {
    case "completed":
      return "text-purple-600";
    case "on_track":
      return "text-green-600";
    case "at_risk":
      return "text-yellow-600";
    case "off_track":
      return "text-red-600";
    case "in_progress":
      return "text-blue-600";
    default:
      return "text-gray-500";
  }
}

export function getStatusLabel(status: ProgressResult["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "on_track":
      return "On Track";
    case "at_risk":
      return "At Risk";
    case "off_track":
      return "Off Track";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}
