"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SuggestedMilestone, SuggestedTodo } from "@/lib/ai/claude";
import {
  formatDate,
  getQuarterLabel,
  getMonthName,
} from "@/lib/utils/date-helpers";

interface PlanPreviewProps {
  sessionId: string;
  goalId: string;
  milestones: SuggestedMilestone[];
  todos: SuggestedTodo[];
}

export function PlanPreview({
  sessionId,
  goalId,
  milestones,
  todos,
}: PlanPreviewProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/plan/${sessionId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones, todos }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept plan");
      }

      router.push(`/goals/${goalId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAccepting(false);
    }
  };

  const quarterlyMilestones = milestones.filter((m) => m.type === "quarterly");
  const monthlyMilestones = milestones.filter((m) => m.type === "monthly");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Plan Preview
      </h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {quarterlyMilestones.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Quarterly Milestones
          </h4>
          <div className="space-y-2">
            {quarterlyMilestones.map((milestone, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  {milestone.quarter && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {getQuarterLabel(milestone.quarter)}
                    </span>
                  )}
                  <span className="font-medium text-gray-900">
                    {milestone.title}
                  </span>
                </div>
                {milestone.description && (
                  <p className="text-sm text-gray-600">
                    {milestone.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Due: {formatDate(new Date(milestone.dueDate))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyMilestones.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Monthly Milestones
          </h4>
          <div className="space-y-2">
            {monthlyMilestones.map((milestone, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  {milestone.month && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {getMonthName(milestone.month)}
                    </span>
                  )}
                  <span className="font-medium text-gray-900">
                    {milestone.title}
                  </span>
                </div>
                {milestone.description && (
                  <p className="text-sm text-gray-600">
                    {milestone.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Due: {formatDate(new Date(milestone.dueDate))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {todos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Initial Todos
          </h4>
          <div className="space-y-2">
            {todos.map((todo, index) => (
              <div
                key={index}
                className="flex items-start gap-2 border border-gray-200 rounded-lg p-3"
              >
                <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300" />
                <div>
                  <span className="font-medium text-gray-900">
                    {todo.title}
                  </span>
                  {todo.description && (
                    <p className="text-sm text-gray-600">{todo.description}</p>
                  )}
                  {todo.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due: {formatDate(new Date(todo.dueDate))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="cursor-pointer w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {accepting ? "Saving Plan..." : "Accept Plan"}
      </button>
    </div>
  );
}
