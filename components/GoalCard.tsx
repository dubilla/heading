import Link from "next/link";
import type { Goal, ProgressUpdate } from "@/lib/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { calculateValueProgress } from "@/lib/utils/progress";
import { formatRelativeTime } from "@/lib/utils/date-helpers";

interface GoalCardProps {
  goal: Goal & { latestProgressUpdate?: ProgressUpdate | null };
  milestoneCount?: number;
}

export function GoalCard({ goal, milestoneCount }: GoalCardProps) {
  const targetDate = new Date(goal.targetDate);
  const formattedDate = targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const latest = goal.latestProgressUpdate ?? null;
  const latestPercent = latest
    ? calculateValueProgress(latest.value, goal.startValue, goal.targetValue)
    : 0;

  return (
    <Link href={`/goals/${goal.id}`} className="block group">
      <div
        className="relative p-6 rounded-2xl glass transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
        style={{
          boxShadow: "var(--shadow-premium)",
          border: "1px solid var(--border-primary)",
        }}
      >
        {/* Hover gradient effect */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-gold"></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3
                className="text-xl font-bold mb-2 truncate"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                }}
              >
                {goal.title}
              </h3>
              {goal.description && (
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {goal.description}
                </p>
              )}
            </div>
            <StatusBadge status={goal.status} />
          </div>

          {/* Progress + staleness */}
          <div className="mt-2">
            <div
              className="flex items-center justify-between text-xs mb-1.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span className="font-semibold">{latestPercent}%</span>
              <span>
                {latest
                  ? `Updated ${formatRelativeTime(new Date(latest.occurredAt))}`
                  : "No updates yet"}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--border-secondary)" }}
            >
              <div
                className="h-full rounded-full bg-gradient-gold transition-all"
                style={{ width: `${latestPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-4 h-px"
            style={{ background: "var(--border-secondary)" }}
          ></div>

          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(251, 191, 36, 0.1)" }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--gold-400)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="font-medium">Due {formattedDate}</span>
            </div>
            {goal.category && (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251, 191, 36, 0.1)" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--gold-400)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <span className="font-medium">{goal.category}</span>
              </div>
            )}
          </div>

          {/* Milestone indicator */}
          {milestoneCount !== undefined && milestoneCount === 0 && (
            <div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{
                background: "rgba(251, 146, 60, 0.1)",
                color: "var(--gold-400)",
                border: "1px solid rgba(251, 146, 60, 0.2)",
              }}
            >
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              No milestones yet
            </div>
          )}

          {/* Hover indicator */}
          <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--gold-400)" }}
            >
              View Details
            </span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--gold-400)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
