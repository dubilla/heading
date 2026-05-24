"use client";

import Link from "next/link";

interface MilestoneNudgeProps {
  goalId: string;
  onAddMilestone: () => void;
}

export function MilestoneNudge({
  goalId,
  onAddMilestone,
}: MilestoneNudgeProps) {
  return (
    <div className="text-center py-12 px-6">
      {/* Visual indicator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
        </div>
        {/* Dashed path lines */}
        <svg className="w-full h-24" viewBox="0 0 200 80">
          <path
            d="M20 40 Q60 20 100 40 T180 40"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Compelling headline */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Turn your goal into a roadmap
      </h3>

      {/* Value proposition */}
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Break your goal into achievable milestones so you can track progress and
        stay on course.
      </p>

      {/* Benefits list */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Track progress
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          Stay accountable
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Feel accomplished
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onAddMilestone}
          className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Your First Milestone
        </button>

        <Link
          href={`/goals/${goalId}/plan`}
          className="cursor-pointer inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Or Plan with AI
        </Link>
      </div>
    </div>
  );
}
