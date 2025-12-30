"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Milestone } from "@/lib/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils/date-helpers";

interface MilestoneCardProps {
  milestone: Milestone;
  label?: string;
}

export function MilestoneCard({ milestone, label }: MilestoneCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this milestone?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (
    status: "not_started" | "in_progress" | "completed" | "off_track"
  ) => {
    try {
      await fetch(`/api/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating milestone:", error);
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {label && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {label}
              </span>
            )}
            <StatusBadge status={milestone.status} />
          </div>
          <h4 className="font-medium text-gray-900 truncate">
            {milestone.title}
          </h4>
          {milestone.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {milestone.description}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Due: {formatDate(new Date(milestone.dueDate))}
          </p>
        </div>

        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 rounded"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                    Set Status
                  </div>
                  <button
                    onClick={() => handleStatusChange("not_started")}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Not Started
                  </button>
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange("completed")}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange("off_track")}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Off Track
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
