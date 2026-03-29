import Link from "next/link";
import type { Objective, Goal } from "@/lib/db/schema";
import { StatusBadge } from "@/components/StatusBadge";

interface ObjectiveCardProps {
  objective: Objective;
  goals?: Goal[];
  showGoalCount?: boolean;
}

export function ObjectiveCard({
  objective,
  goals = [],
  showGoalCount = true,
}: ObjectiveCardProps) {
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalGoals = goals.length;
  const progressPercent =
    totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <Link href={`/objectives/${objective.id}`} className="block group">
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
                {objective.title}
              </h3>
              {objective.description && (
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {objective.description}
                </p>
              )}
            </div>
            <StatusBadge status={objective.status} />
          </div>

          {showGoalCount && (
            <>
              {/* Divider */}
              <div
                className="my-4 h-px"
                style={{ background: "var(--border-secondary)" }}
              ></div>

              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(168, 85, 247, 0.1)" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "#a855f7" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <span className="font-medium">
                  {completedGoals} / {totalGoals} goals completed
                </span>
              </div>

              {totalGoals > 0 && (
                <div className="mt-3">
                  <div
                    className="w-full rounded-full h-2"
                    style={{ background: "var(--border-secondary)" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${progressPercent}%`,
                        background:
                          progressPercent === 100
                            ? "#22c55e"
                            : "linear-gradient(90deg, #a855f7, #c084fc)",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
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
