"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Milestone } from "@/lib/db/schema";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, getMonthsForQuarter } from "@/lib/utils/date-helpers";

interface MilestoneCardProps {
  milestone: Milestone;
  label?: string;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function MilestoneCard({ milestone, label }: MilestoneCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);
  const [editDescription, setEditDescription] = useState(
    milestone.description ?? ""
  );
  const [editDueDate, setEditDueDate] = useState(
    toLocalDateString(new Date(milestone.dueDate))
  );
  const [editType, setEditType] = useState<"quarterly" | "monthly">(
    milestone.type
  );
  const [editQuarter, setEditQuarter] = useState(milestone.quarter ?? 1);
  const [editMonth, setEditMonth] = useState(
    milestone.month ?? getMonthsForQuarter(milestone.quarter ?? 1)[0]
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const startEdit = () => {
    setShowMenu(false);
    setEditTitle(milestone.title);
    setEditDescription(milestone.description ?? "");
    setEditDueDate(toLocalDateString(new Date(milestone.dueDate)));
    setEditType(milestone.type);
    setEditQuarter(milestone.quarter ?? 1);
    setEditMonth(
      milestone.month ?? getMonthsForQuarter(milestone.quarter ?? 1)[0]
    );
    setEditError(null);
    setEditing(true);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      setEditError("Title is required");
      return;
    }
    setEditError(null);
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          dueDate: editDueDate,
          type: editType,
          quarter: editQuarter,
          month: editType === "monthly" ? editMonth : null,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setEditError(result.error || "Something went wrong");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setEditError("Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  };

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

  if (editing) {
    return (
      <div className="bg-white border border-blue-300 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <select
            value={editType}
            onChange={(e) => {
              const nextType = e.target.value as "quarterly" | "monthly";
              setEditType(nextType);
              if (nextType === "monthly") {
                setEditMonth(getMonthsForQuarter(editQuarter)[0]);
              }
            }}
            aria-label="Milestone type"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={editQuarter}
            onChange={(e) => {
              const nextQuarter = parseInt(e.target.value);
              setEditQuarter(nextQuarter);
              if (editType === "monthly") {
                setEditMonth(getMonthsForQuarter(nextQuarter)[0]);
              }
            }}
            aria-label="Milestone quarter"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={1}>Q1 (Jan-Mar)</option>
            <option value={2}>Q2 (Apr-Jun)</option>
            <option value={3}>Q3 (Jul-Sep)</option>
            <option value={4}>Q4 (Oct-Dec)</option>
          </select>
        </div>
        {editType === "monthly" && (
          <select
            value={editMonth}
            onChange={(e) => setEditMonth(parseInt(e.target.value))}
            aria-label="Milestone month"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {getMonthsForQuarter(editQuarter).map((month) => (
              <option key={month} value={month}>
                {new Date(2026, month - 1, 1).toLocaleDateString("en-US", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          maxLength={200}
          aria-label="Milestone title"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Description (optional)"
          aria-label="Milestone description"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            aria-label="Milestone due date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={savingEdit}
              className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEditSave}
              disabled={savingEdit}
              className="cursor-pointer rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingEdit ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        {editError && (
          <p className="text-sm text-red-500" role="alert">
            {editError}
          </p>
        )}
      </div>
    );
  }

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
                    onClick={startEdit}
                    className="cursor-pointer w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
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
