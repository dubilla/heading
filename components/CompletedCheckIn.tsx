"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInForm, ExistingCheckIn } from "@/components/CheckInForm";

/**
 * The current week's completed-check-in banner, with an Edit toggle that
 * reopens the form prefilled. Past weeks stay read-only — the API enforces it
 * too, this component is only ever rendered for the current week.
 */
export function CompletedCheckIn({ checkIn }: { checkIn: ExistingCheckIn }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div
        className="glass p-8 rounded-2xl mb-8 animate-fade-in-up border-gradient-gold"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          Edit This Week&apos;s Check-in
        </h2>
        <CheckInForm
          checkIn={checkIn}
          onSuccess={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="glass p-6 rounded-2xl mb-8 animate-fade-in-up"
      style={{
        boxShadow: "var(--shadow-premium)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        animationDelay: "0.1s",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(34, 197, 94, 0.2)" }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "#22c55e" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg" style={{ color: "#22c55e" }}>
            Check-in completed for this week!
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Great job reflecting on your progress. See you next week!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer shrink-0 rounded-md border border-gray-500 px-4 py-2 text-sm font-medium transition-all hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
