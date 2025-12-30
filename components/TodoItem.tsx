"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Todo } from "@/lib/db/schema";
import { formatDate, isOverdue } from "@/lib/utils/date-helpers";

interface TodoItemProps {
  todo: Todo;
  showGoalInfo?: boolean;
}

export function TodoItem({ todo }: TodoItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error toggling todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
    setShowMenu(false);
  };

  const overdue =
    todo.dueDate && !todo.completed && isOverdue(new Date(todo.dueDate));

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        todo.completed
          ? "bg-gray-50 border-gray-200"
          : overdue
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-200"
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`cursor-pointer mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-blue-600 border-blue-600"
            : "border-gray-300 hover:border-blue-500"
        } ${loading ? "opacity-50" : ""}`}
      >
        {todo.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            todo.completed ? "text-gray-500 line-through" : "text-gray-900"
          }`}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
            {todo.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {todo.dueDate && (
            <span
              className={`text-xs ${
                overdue ? "text-red-600 font-medium" : "text-gray-500"
              }`}
            >
              {overdue ? "Overdue: " : "Due: "}
              {formatDate(new Date(todo.dueDate))}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg
            className="w-4 h-4"
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
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <button
                onClick={handleDelete}
                className="cursor-pointer w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
