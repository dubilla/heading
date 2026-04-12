"use client";

import { useState } from "react";
import type { Milestone } from "@/lib/db/schema";
import { MilestoneCard } from "@/components/MilestoneCard";
import { MilestoneForm } from "@/components/MilestoneForm";
import { MilestoneNudge } from "@/components/MilestoneNudge";
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
        <MilestoneNudge
          goalId={goalId}
          onAddMilestone={() => setShowForm(true)}
        />
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
