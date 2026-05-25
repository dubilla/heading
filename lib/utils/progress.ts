/**
 * Compute a 0-100 percentage from a user-reported value on a goal with a
 * start/target range. Handles both increasing (start < target) and
 * decreasing (start > target, e.g. weight loss) goals. Overshoot is clamped
 * in display, but input values are not validated here — callers are free to
 * record any value and we just report how it maps onto the range.
 */
export function calculateValueProgress(
  value: number,
  startValue: number,
  targetValue: number
): number {
  if (startValue === targetValue) return 0;
  const range = targetValue - startValue;
  const progressed = value - startValue;
  const raw = (progressed / range) * 100;
  if (raw <= 0) return 0;
  if (raw >= 100) return 100;
  return Math.round(raw);
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

export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "on_track"
  | "at_risk"
  | "off_track"
  | "completed";

export function getStatusColor(status: ProgressStatus): string {
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
