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

  return (
    <Link href={`/objectives/${objective.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {objective.title}
            </h3>
            {objective.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {objective.description}
              </p>
            )}
          </div>
          <StatusBadge status={objective.status} />
        </div>

        {showGoalCount && (
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span>
                {completedGoals} / {totalGoals} goals completed
              </span>
            </div>
          </div>
        )}

        {totalGoals > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
