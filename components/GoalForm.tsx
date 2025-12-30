"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Goal, Objective } from "@/lib/db/schema";

interface GoalFormProps {
  goal?: Goal;
  objectives?: Objective[];
  defaultObjectiveId?: string | null;
  onSuccess?: () => void;
}

export function GoalForm({
  goal,
  objectives: initialObjectives,
  defaultObjectiveId,
  onSuccess,
}: GoalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>(
    initialObjectives || []
  );
  const [loadingObjectives, setLoadingObjectives] =
    useState(!initialObjectives);

  // Get objectiveId from URL params or props
  const urlObjectiveId = searchParams.get("objectiveId");
  const initialObjectiveId =
    goal?.objectiveId || defaultObjectiveId || urlObjectiveId || "";

  useEffect(() => {
    if (!initialObjectives) {
      fetch("/api/objectives")
        .then((res) => res.json())
        .then((data) => {
          setObjectives(data.data || []);
          setLoadingObjectives(false);
        })
        .catch(() => {
          setLoadingObjectives(false);
        });
    }
  }, [initialObjectives]);

  const isEditing = !!goal;
  const defaultTargetDate = goal?.targetDate
    ? new Date(goal.targetDate).toISOString().split("T")[0]
    : new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const objectiveIdValue = formData.get("objectiveId") as string;
    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      targetDate: formData.get("targetDate") as string,
      category: (formData.get("category") as string) || null,
      objectiveId: objectiveIdValue || null,
    };

    try {
      const url = isEditing ? `/api/goals/${goal.id}` : "/api/goals";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/goals/${result.data.id}`);
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={goal?.title || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Run a marathon"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={goal?.description || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe your goal in more detail..."
        />
      </div>

      <div>
        <label
          htmlFor="objectiveId"
          className="block text-sm font-medium text-gray-700"
        >
          Objective
        </label>
        <select
          id="objectiveId"
          name="objectiveId"
          defaultValue={initialObjectiveId}
          disabled={loadingObjectives}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">No objective (standalone goal)</option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Link this goal to an objective for better organization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="targetDate"
            className="block text-sm font-medium text-gray-700"
          >
            Target Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="targetDate"
            name="targetDate"
            required
            defaultValue={defaultTargetDate}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            maxLength={50}
            defaultValue={goal?.category || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Health, Career, Personal"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : isEditing ? "Update Goal" : "Create Goal"}
        </button>
      </div>
    </form>
  );
}
