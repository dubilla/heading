import Link from "next/link";
import type { Goal } from "@/lib/db/schema";
import { StatusBadge } from "@/components/StatusBadge";

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const targetDate = new Date(goal.targetDate);
  const formattedDate = targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
