"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CrewTaskSummary } from "@/lib/integrations/crew";

interface TodoFormProps {
  goalId: string;
  milestoneId?: string;
  crewEnabled?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Mode = "create" | "link";

export function TodoForm({
  goalId,
  milestoneId,
  crewEnabled = false,
  onSuccess,
  onCancel,
}: TodoFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDone = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      goalId,
      milestoneId: milestoneId || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      dueDate: (formData.get("dueDate") as string) || null,
    };

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }
      handleDone();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {crewEnabled && (
        <div className="flex gap-1 rounded-md bg-gray-100 p-0.5 text-sm">
          {(["create", "link"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 cursor-pointer rounded px-3 py-1 font-medium transition-colors ${
                mode === m
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "create" ? "Create new" : "Link from Crew"}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {mode === "create" ? (
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <input
              type="text"
              name="title"
              required
              maxLength={200}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Due Date (optional)
              </label>
              <input
                type="date"
                name="dueDate"
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                name="description"
                maxLength={1000}
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add details..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Todo"}
            </button>
          </div>
        </form>
      ) : (
        <CrewTaskPicker
          goalId={goalId}
          milestoneId={milestoneId}
          onLinked={handleDone}
          onCancel={onCancel}
          setError={setError}
        />
      )}
    </div>
  );
}

function CrewTaskPicker({
  goalId,
  milestoneId,
  onLinked,
  onCancel,
  setError,
}: {
  goalId: string;
  milestoneId?: string;
  onLinked: () => void;
  onCancel?: () => void;
  setError: (msg: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CrewTaskSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/crew/tasks?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(res.ok ? (json.data ?? []) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleLink = async (task: CrewTaskSummary) => {
    setError(null);
    setLinkingId(task.id);
    try {
      const res = await fetch("/api/todos/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          milestoneId: milestoneId || null,
          crewTaskId: task.id,
          title: task.title,
          dueDate: task.dueDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Couldn't link that task");
        setLinkingId(null);
        return;
      }
      onLinked();
    } catch {
      setError("Couldn't link that task");
      setLinkingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Search your Crew tasks..."
      />

      {query.trim().length > 0 && (
        <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
          {searching && results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400">No matching tasks</p>
          ) : (
            results.map((task) => {
              const alreadyLinked = task.externalSource !== null;
              return (
                <button
                  key={task.id}
                  type="button"
                  disabled={alreadyLinked || linkingId !== null}
                  onClick={() => handleLink(task)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                    {task.title}
                  </span>
                  {alreadyLinked ? (
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      already linked
                    </span>
                  ) : linkingId === task.id ? (
                    <span className="flex-shrink-0 text-xs text-blue-600">
                      linking…
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs font-medium text-blue-600">
                      Link
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {onCancel && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
