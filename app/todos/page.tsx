import { auth } from "@/lib/auth";
import { getTodosByUserId, getTodoStats } from "@/lib/db/todos";
import { getGoalsByUserId } from "@/lib/db/goals";
import { Navbar } from "@/components/Navbar";
import { TodoItem } from "@/components/TodoItem";
import Link from "next/link";

export default async function TodosPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const [todos, goals, stats] = await Promise.all([
    getTodosByUserId(userId),
    getGoalsByUserId(userId),
    getTodoStats(userId),
  ]);

  // Group todos by status
  const overdueTodos = todos.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return new Date(t.dueDate) < new Date();
  });

  const todayTodos = todos.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return (
      dueDate.getFullYear() === today.getFullYear() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getDate() === today.getDate()
    );
  });

  const upcomingTodos = todos.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(t.dueDate);
    return dueDate >= tomorrow;
  });

  const noDueDateTodos = todos.filter((t) => !t.dueDate && !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Todos</h1>
            <p className="text-gray-600 mt-1">
              {stats.pending} pending, {stats.completed} completed
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Due This Week</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.dueThisWeek}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.completed}
            </p>
          </div>
        </div>

        {todos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No todos yet
            </h2>
            <p className="text-gray-600 mb-6">
              {goals.length > 0
                ? "Add todos to your goals to get started."
                : "Create a goal first, then add todos."}
            </p>
            <Link
              href={goals.length > 0 ? "/goals" : "/goals/new"}
              className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {goals.length > 0 ? "View Goals" : "Create Your First Goal"}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {overdueTodos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h2 className="text-lg font-semibold text-red-600 mb-4">
                  Overdue ({overdueTodos.length})
                </h2>
                <div className="space-y-2">
                  {overdueTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {todayTodos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Today ({todayTodos.length})
                </h2>
                <div className="space-y-2">
                  {todayTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {upcomingTodos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upcoming ({upcomingTodos.length})
                </h2>
                <div className="space-y-2">
                  {upcomingTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {noDueDateTodos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  No Due Date ({noDueDateTodos.length})
                </h2>
                <div className="space-y-2">
                  {noDueDateTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {completedTodos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-500 mb-4">
                  Completed ({completedTodos.length})
                </h2>
                <div className="space-y-2">
                  {completedTodos.slice(0, 10).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                  {completedTodos.length > 10 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      and {completedTodos.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
