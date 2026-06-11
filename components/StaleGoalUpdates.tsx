"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type StaleGoalSummary = {
  id: string;
  title: string;
  unit: string;
  startValue: number;
  targetValue: number;
  latestValue: number | null;
  lastUpdatedAt: string | null;
};

export function lastUpdatedLabel(
  iso: string | null,
  now: Date = new Date()
): string {
  if (!iso) return "Never updated";
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000
  );
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 14) return `Updated ${days} days ago`;
  return `Updated ${Math.floor(days / 7)} weeks ago`;
}

function StaleGoalRow({
  goal,
  onSaved,
}: {
  goal: StaleGoalSummary;
  onSaved: (id: string) => void;
}) {
  const [value, setValue] = useState(
    String(goal.latestValue ?? goal.startValue)
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const parsed = Number(value);
    if (value.trim() === "" || Number.isNaN(parsed)) {
      setError("Enter a number");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}/progress-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parsed,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error || "Something went wrong");
        setSaving(false);
        return;
      }

      onSaved(goal.id);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div
      className="glass p-4 rounded-xl"
      style={{ border: "1px solid var(--border-secondary)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/goals/${goal.id}`}
            className="font-semibold hover:underline break-words"
            style={{ color: "var(--text-primary)" }}
          >
            {goal.title}
          </Link>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {lastUpdatedLabel(goal.lastUpdatedAt)} ·{" "}
            {goal.latestValue ?? goal.startValue} → {goal.targetValue}{" "}
            {goal.unit}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`New value for ${goal.title}`}
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            placeholder="Note (optional)"
            aria-label={`Note for ${goal.title}`}
            className="w-36 sm:w-44 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StaleGoalUpdates({ goals }: { goals: StaleGoalSummary[] }) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const remaining = goals.filter((g) => !savedIds.has(g.id));

  const handleSaved = (id: string) => {
    setSavedIds((prev) => new Set(prev).add(id));
    router.refresh();
  };

  if (remaining.length === 0) {
    return (
      <p style={{ color: "var(--text-secondary)" }}>
        All goals are up to date for this week. Nice work!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {remaining.map((goal) => (
        <StaleGoalRow key={goal.id} goal={goal} onSaved={handleSaved} />
      ))}
    </div>
  );
}
