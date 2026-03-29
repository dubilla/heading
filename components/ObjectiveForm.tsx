"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Objective } from "@/lib/db/schema";

interface ObjectiveFormProps {
  objective?: Objective;
  onSuccess?: () => void;
}

export function ObjectiveForm({ objective, onSuccess }: ObjectiveFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = !!objective;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
    };

    try {
      const url = isEditing
        ? `/api/objectives/${objective.id}`
        : "/api/objectives";
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
        router.push(`/objectives/${result.data.id}`);
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
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <p className="text-sm" style={{ color: "#f87171" }}>
            {error}
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Title <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={objective?.title || ""}
          className="block w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 transition-all"
          style={{
            border: "1px solid var(--border-primary)",
            color: "var(--text-primary)",
          }}
          placeholder="e.g., Become a better runner"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={objective?.description || ""}
          className="block w-full rounded-xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 transition-all"
          style={{
            border: "1px solid var(--border-primary)",
            color: "var(--text-primary)",
          }}
          placeholder="Describe your objective in more detail..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
          style={{
            border: "1px solid var(--border-primary)",
            color: "var(--text-secondary)",
            background: "transparent",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-xl bg-gradient-gold px-6 py-2.5 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: "var(--background-primary)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Objective"
              : "Create Objective"}
        </button>
      </div>
    </form>
  );
}
