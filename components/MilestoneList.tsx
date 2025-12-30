"use client";

import { useState } from "react";
import type { Milestone } from "@/lib/db/schema";
import { MilestoneCard } from "@/components/MilestoneCard";
import { MilestoneForm } from "@/components/MilestoneForm";
import { getQuarterLabel, getMonthName } from "@/lib/utils/date-helpers";

interface MilestoneListProps {
  goalId: string;
  milestones: Milestone[];
}

export function MilestoneList({ goalId, milestones }: MilestoneListProps) {
  const [showForm, setShowForm] = useState(false);

  const quarterlyMilestones = milestones.filter((m) => m.type === "quarterly");
  const monthlyMilestones = milestones.filter((m) => m.type === "monthly");

  // Group monthly milestones by quarter
  const monthlyByQuarter = monthlyMilestones.reduce(
    (acc, milestone) => {
      const quarter = milestone.quarter || 1;
      if (!acc[quarter]) {
        acc[quarter] = [];
      }
      acc[quarter].push(milestone);
      return acc;
    },
    {} as Record<number, Milestone[]>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Milestones</h2>
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Milestone
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <MilestoneForm
            goalId={goalId}
            onSuccess={() => {
              setShowForm(false);
              window.location.reload();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>No milestones yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
          >
            Create your first milestone
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {quarterlyMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Quarterly Milestones
              </h3>
              <div className="space-y-3">
                {quarterlyMilestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    label={
                      milestone.quarter
                        ? getQuarterLabel(milestone.quarter)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {Object.entries(monthlyByQuarter).map(([quarter, mMilestones]) => (
            <div key={quarter}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {getQuarterLabel(parseInt(quarter))} Monthly Milestones
              </h3>
              <div className="space-y-3">
                {mMilestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    label={
                      milestone.month
                        ? getMonthName(milestone.month)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
