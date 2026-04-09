"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Goal, ProgressUpdate } from "@/lib/db/schema";
import { calculateValueProgress } from "@/lib/utils/progress";
import { formatRelativeTime } from "@/lib/utils/date-helpers";
import { ProgressBar } from "@/components/ProgressBar";

interface ProgressUpdatesProps {
  goal: Goal;
  initialUpdates: ProgressUpdate[];
}

type FormMode = { kind: "create" } | { kind: "edit"; id: string };

function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // YYYY-MM-DD in local time
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ProgressUpdates({
  goal,
  initialUpdates,
}: ProgressUpdatesProps) {
  const router = useRouter();
  const [updates, setUpdates] = useState<ProgressUpdate[]>(initialUpdates);
  const [mode, setMode] = useState<FormMode>({ kind: "create" });
  const [value, setValue] = useState<string>(
    initialUpdates[0]?.value?.toString() ?? goal.startValue.toString()
  );
  const [note, setNote] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(
    toDateInputValue(new Date())
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const latest = updates[0] ?? null;
  const latestPercent = useMemo(() => {
    if (!latest) return 0;
    return calculateValueProgress(
      latest.value,
      goal.startValue,
      goal.targetValue
    );
  }, [latest, goal.startValue, goal.targetValue]);

  const unitLabel = goal.unit === "%" ? "%" : goal.unit ? ` ${goal.unit}` : "";

  const resetForm = () => {
    setMode({ kind: "create" });
    setValue(updates[0]?.value?.toString() ?? goal.startValue.toString());
    setNote("");
    setOccurredAt(toDateInputValue(new Date()));
    setError(null);
  };

  const startEdit = (update: ProgressUpdate) => {
    setMode({ kind: "edit", id: update.id });
    setValue(update.value.toString());
    setNote(update.note ?? "");
    setOccurredAt(toDateInputValue(new Date(update.occurredAt)));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = {
      value: Number(value),
      note: note.trim() === "" ? null : note.trim(),
      occurredAt,
    };

    try {
      const url =
        mode.kind === "create"
          ? `/api/goals/${goal.id}/progress-updates`
          : `/api/goals/${goal.id}/progress-updates/${mode.id}`;
      const method = mode.kind === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const returned = data.data as ProgressUpdate;
      if (mode.kind === "create") {
        const inserted = [returned, ...updates].sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
        setUpdates(inserted);
      } else {
        const updated = updates
          .map((u) => (u.id === returned.id ? returned : u))
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() -
              new Date(a.occurredAt).getTime()
          );
        setUpdates(updated);
      }
      resetForm();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this progress update?")) return;
    const res = await fetch(`/api/goals/${goal.id}/progress-updates/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setUpdates(updates.filter((u) => u.id !== id));
      if (mode.kind === "edit" && mode.id === id) resetForm();
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Reported progress
          </span>
          <span className="text-sm text-gray-500">
            {latest ? (
              <>
                {latest.value}
                {unitLabel} of {goal.targetValue}
                {unitLabel} • {latestPercent}%
              </>
            ) : (
              <>
                No updates yet • target {goal.targetValue}
                {unitLabel}
              </>
            )}
          </span>
        </div>
        <ProgressBar
          progress={latestPercent}
          status={latestPercent === 100 ? "completed" : "in_progress"}
          size="md"
        />
        {latest && (
          <p className="mt-2 text-xs text-gray-500">
            Last updated {formatRelativeTime(new Date(latest.occurredAt))}
            {latest.note ? ` — ${latest.note}` : ""}
          </p>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {mode.kind === "create" ? "Log an update" : "Edit update"}
          </h3>
          {mode.kind === "edit" && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel edit
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded p-2">{error}</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Value {goal.unit ? `(${goal.unit})` : ""}
            </label>
            <input
              type="number"
              step="any"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Date
            </label>
            <input
              type="date"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">
            Note (optional)
          </label>
          <textarea
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened?"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Saving..."
              : mode.kind === "create"
                ? "Log update"
                : "Save changes"}
          </button>
        </div>
      </form>

      {/* History */}
      {updates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            History ({updates.length})
          </h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {updates.map((u) => {
              const percent = calculateValueProgress(
                u.value,
                goal.startValue,
                goal.targetValue
              );
              return (
                <li
                  key={u.id}
                  className="px-4 py-3 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {u.value}
                      {unitLabel}{" "}
                      <span className="text-gray-500 font-normal">
                        ({percent}%)
                      </span>
                    </div>
                    {u.note && (
                      <p className="text-sm text-gray-600 mt-0.5">{u.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(u.occurredAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      • {formatRelativeTime(new Date(u.occurredAt))}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
