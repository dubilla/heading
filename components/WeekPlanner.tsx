"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TodoItem } from "@/components/TodoItem";
import { getWeekEndDate } from "@/lib/utils/week-helpers";
import type { Todo } from "@/lib/db/schema";

type PlannerTodo = Todo & { goal?: { id: string; title: string } | null };

interface WeekPlannerProps {
  overdue: PlannerTodo[];
  thisWeek: PlannerTodo[];
  undated: PlannerTodo[];
  goals: { id: string; title: string }[];
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ScheduleThisWeekButton({ todoId }: { todoId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: toLocalDateString(getWeekEndDate()),
        }),
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="cursor-pointer shrink-0 rounded-md border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? "Scheduling..." : "This week"}
    </button>
  );
}

function QuickAddTodo({ goals }: { goals: { id: string; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(() =>
    toLocalDateString(getWeekEndDate())
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !goalId) return;

    setSaving(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          title: title.trim(),
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error || "Something went wrong");
        return;
      }

      setTitle("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a todo for this week..."
          aria-label="New todo title"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          aria-label="Goal for new todo"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-48"
        >
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date for new todo"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-2" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function PlannerSection({
  title,
  accent,
  todos,
  withScheduleButton = false,
}: {
  title: string;
  accent?: string;
  todos: PlannerTodo[];
  withScheduleButton?: boolean;
}) {
  if (todos.length === 0) return null;

  return (
    <div>
      <h3
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: accent ?? "var(--text-tertiary)" }}
      >
        {title} ({todos.length})
      </h3>
      <div className="space-y-3">
        {todos.map((todo) =>
          withScheduleButton ? (
            <div key={todo.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <TodoItem todo={todo} />
              </div>
              <ScheduleThisWeekButton todoId={todo.id} />
            </div>
          ) : (
            <TodoItem key={todo.id} todo={todo} />
          )
        )}
      </div>
    </div>
  );
}

export function WeekPlanner({
  overdue,
  thisWeek,
  undated,
  goals,
}: WeekPlannerProps) {
  const hasAnything = overdue.length + thisWeek.length + undated.length > 0;

  return (
    <div className="space-y-6">
      {goals.length > 0 && <QuickAddTodo goals={goals} />}

      {!hasAnything && (
        <p style={{ color: "var(--text-secondary)" }}>
          Nothing scheduled yet — add a todo above to plan your week.
        </p>
      )}

      <PlannerSection
        title="Overdue — reschedule or finish"
        accent="#ef4444"
        todos={overdue}
        withScheduleButton
      />
      <PlannerSection
        title="Due this week"
        accent="var(--gold-400)"
        todos={thisWeek}
      />
      <PlannerSection
        title="No due date — pull into the week?"
        todos={undated}
        withScheduleButton
      />
    </div>
  );
}
