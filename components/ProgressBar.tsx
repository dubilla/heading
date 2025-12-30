import { getStatusColor } from "@/lib/utils/progress";
import type { ProgressResult } from "@/lib/utils/progress";

interface ProgressBarProps {
  progress: number;
  status?: ProgressResult["status"];
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  showExpected?: boolean;
  expectedProgress?: number;
}

export function ProgressBar({
  progress,
  status = "in_progress",
  showLabel = true,
  size = "md",
  showExpected = false,
  expectedProgress = 0,
}: ProgressBarProps) {
  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size];

  const colorClass = getStatusColor(status);

  return (
    <div className="w-full">
      <div
        className={`relative w-full bg-gray-200 rounded-full ${heightClass}`}
      >
        <div
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {showExpected && expectedProgress > 0 && (
          <div
            className="absolute top-0 w-0.5 h-full bg-gray-400"
            style={{ left: `${Math.min(expectedProgress, 100)}%` }}
            title={`Expected: ${expectedProgress}%`}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{progress}% complete</span>
          {showExpected && expectedProgress > 0 && (
            <span className="text-xs text-gray-400">
              Expected: {expectedProgress}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
