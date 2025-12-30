"use client";

import { useState } from "react";
import type { Todo } from "@/lib/db/schema";
import { TodoItem } from "@/components/TodoItem";
import { TodoForm } from "@/components/TodoForm";

interface TodoListProps {
  todos: Todo[];
  goalId?: string;
  milestoneId?: string;
  showAddForm?: boolean;
}

export function TodoList({
  todos,
  goalId,
  milestoneId,
  showAddForm = true,
}: TodoListProps) {
  const [showForm, setShowForm] = useState(false);

  const pendingTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div>
      {showAddForm && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Todos</h2>
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Todo
          </button>
        </div>
      )}

      {showForm && goalId && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <TodoForm
            goalId={goalId}
            milestoneId={milestoneId}
            onSuccess={() => {
              setShowForm(false);
              window.location.reload();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {todos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No todos yet</p>
          {showAddForm && goalId && (
            <button
              onClick={() => setShowForm(true)}
              className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
            >
              Add your first todo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTodos.length > 0 && (
            <div className="space-y-2">
              {pendingTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}

          {completedTodos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Completed ({completedTodos.length})
              </h3>
              <div className="space-y-2">
                {completedTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
