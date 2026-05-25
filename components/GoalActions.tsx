"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GOAL_STATUS_OPTIONS, type GoalStatus } from "@/lib/goal-status";

interface GoalActionsProps {
  goalId: string;
  currentStatus: GoalStatus;
}

export function GoalActions({ goalId, currentStatus }: GoalActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSetStatus = async (status: GoalStatus) => {
    if (status === currentStatus) {
      setShowMenu(false);
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setShowMenu(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating goal status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/goals");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      setDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <p className="px-4 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Set status
            </p>
            {GOAL_STATUS_OPTIONS.map((option) => {
              const isCurrent = option.value === currentStatus;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSetStatus(option.value)}
                  disabled={updatingStatus || isCurrent}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-default ${
                    isCurrent ? "font-medium text-gray-900" : "text-gray-700"
                  }`}
                >
                  {option.label}
                  {isCurrent && (
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}

            <div className="my-1 h-px bg-gray-200" />

            <Link
              href={`/goals/${goalId}/edit`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              Edit Goal
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Goal"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
