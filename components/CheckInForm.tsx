"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getWeekStartDate, formatWeekRange } from "@/lib/utils/week-helpers";

interface CheckInFormProps {
  onSuccess?: () => void;
}

export function CheckInForm({ onSuccess }: CheckInFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAdjustment, setNeedsAdjustment] = useState(false);

  const weekStartDate = getWeekStartDate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      weekStartDate: weekStartDate.toISOString(),
      accomplishments: formData.get("accomplishments") as string,
      challenges: formData.get("challenges") as string,
      nextWeekPriorities: formData.get("nextWeekPriorities") as string,
      needsAdjustment,
    };

    try {
      const response = await fetch("/api/check-ins", {
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/check-ins");
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

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800">
          Week of {formatWeekRange(weekStartDate)}
        </p>
      </div>

      <div>
        <label
          htmlFor="accomplishments"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          What did you accomplish this week?{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="accomplishments"
          name="accomplishments"
          required
          rows={4}
          maxLength={5000}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="List your achievements, completed tasks, and progress made..."
        />
      </div>

      <div>
        <label
          htmlFor="challenges"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          What challenges did you face? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="challenges"
          name="challenges"
          required
          rows={4}
          maxLength={5000}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe any obstacles, setbacks, or difficulties you encountered..."
        />
      </div>

      <div>
        <label
          htmlFor="nextWeekPriorities"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          What are your priorities for next week?{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="nextWeekPriorities"
          name="nextWeekPriorities"
          required
          rows={4}
          maxLength={5000}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="List the tasks and goals you want to focus on next week..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="needsAdjustment"
          checked={needsAdjustment}
          onChange={(e) => setNeedsAdjustment(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="needsAdjustment" className="text-sm text-gray-700">
          I feel my goals need adjustment
        </label>
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
          {loading ? "Saving..." : "Submit Check-in"}
        </button>
      </div>
    </form>
  );
}
