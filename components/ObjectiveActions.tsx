"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ObjectiveActionsProps {
  objectiveId: string;
}

export function ObjectiveActions({ objectiveId }: ObjectiveActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this objective?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/objectives/${objectiveId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/objectives");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting objective:", error);
      setDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="cursor-pointer p-2 rounded-lg transition-colors"
        style={{ color: "var(--text-tertiary)" }}
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
          <div
            className="absolute right-0 mt-2 w-48 glass rounded-xl z-20 overflow-hidden"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <Link
              href={`/objectives/${objectiveId}/edit`}
              className="block px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setShowMenu(false)}
            >
              Edit Objective
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer w-full text-left px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ color: "#f87171" }}
            >
              {deleting ? "Deleting..." : "Delete Objective"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
