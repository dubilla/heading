"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Todo } from "@/lib/db/schema";
import { formatDate, isOverdue } from "@/lib/utils/date-helpers";

interface TodoItemProps {
  todo: Todo & { goal?: { id: string; title: string } | null };
  // Default true so the dashboard and /todos lists — which mix todos across
  // many goals — link back to each parent. Goal-detail pages set this to false
  // because the goal context is already visible.
  showGoalInfo?: boolean;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPresetDateString(preset: "today" | "tomorrow" | "next-week"): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (preset === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (preset === "next-week") {
    date.setDate(date.getDate() + 7);
  }
  return toLocalDateString(date);
}

export function TodoItem({ todo, showGoalInfo = true }: TodoItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const closeMenu = () => {
    setShowMenu(false);
    setShowReschedule(false);
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error toggling todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
    closeMenu();
  };

  const handleReschedule = async (dueDate: string | null) => {
    setRescheduling(true);
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });
      if (response.ok) {
        closeMenu();
        router.refresh();
      }
    } catch (error) {
      console.error("Error rescheduling todo:", error);
    } finally {
      setRescheduling(false);
    }
  };

  const overdue =
    todo.dueDate && !todo.completed && isOverdue(new Date(todo.dueDate));

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        todo.completed
          ? "bg-gray-50 border-gray-200"
          : overdue
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-200"
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`cursor-pointer mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-blue-600 border-blue-600"
            : "border-gray-300 hover:border-blue-500"
        } ${loading ? "opacity-50" : ""}`}
      >
        {todo.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            todo.completed ? "text-gray-500 line-through" : "text-gray-900"
          }`}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
            {todo.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {showGoalInfo && todo.goal && (
            <Link
              href={`/goals/${todo.goal.id}`}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[16rem]"
            >
              Goal: {todo.goal.title}
            </Link>
          )}
          {todo.dueDate && (
            <span
              className={`text-xs ${
                overdue ? "text-red-600 font-medium" : "text-gray-500"
              }`}
            >
              {overdue ? "Overdue: " : "Due: "}
              {formatDate(new Date(todo.dueDate))}
            </span>
          )}
          {todo.crewTaskId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z"
                />
              </svg>
              {todo.origin === "crew" ? "Linked from Crew" : "In Crew"}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setShowMenu(!showMenu);
            setShowReschedule(false);
          }}
          aria-label="Todo actions"
          className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 rounded"
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={closeMenu}
            />
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
              {showReschedule ? (
                <div className="px-1">
                  <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Reschedule
                  </p>
                  <button
                    onClick={() => handleReschedule(getPresetDateString("today"))}
                    disabled={rescheduling}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleReschedule(getPresetDateString("tomorrow"))}
                    disabled={rescheduling}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => handleReschedule(getPresetDateString("next-week"))}
                    disabled={rescheduling}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    Next week
                  </button>
                  <div className="px-3 py-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Pick a date
                    </label>
                    <input
                      type="date"
                      aria-label="Pick a date"
                      disabled={rescheduling}
                      defaultValue={
                        todo.dueDate
                          ? toLocalDateString(new Date(todo.dueDate))
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleReschedule(e.target.value);
                        }
                      }}
                      className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={() => handleReschedule(null)}
                    disabled={rescheduling || !todo.dueDate}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear due date
                  </button>
                  <div className="my-1 h-px bg-gray-200" />
                  <button
                    onClick={() => setShowReschedule(false)}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={handleDelete}
                    className="cursor-pointer w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
