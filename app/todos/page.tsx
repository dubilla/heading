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
    <div
      className="min-h-screen"
      style={{ background: "var(--background-primary)" }}
    >
      <Navbar userName={session?.user?.name} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12 animate-fade-in-up">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Daily Actions
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {stats.pending} pending, {stats.completed} completed
            </p>
          </div>
        </div>

        <div
          className="grid gap-4 md:grid-cols-4 mb-12 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div
            className="glass p-5 rounded-xl"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Overdue
            </p>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "#ef4444" }}
            >
              {stats.overdue}
            </p>
          </div>
          <div
            className="glass p-5 rounded-xl"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid rgba(249, 115, 22, 0.2)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              This Week
            </p>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "#f97316" }}
            >
              {stats.dueThisWeek}
            </p>
          </div>
          <div
            className="glass p-5 rounded-xl"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Pending
            </p>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              {stats.pending}
            </p>
          </div>
          <div
            className="glass p-5 rounded-xl"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Completed
            </p>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "#22c55e" }}
            >
              {stats.completed}
            </p>
          </div>
        </div>

        {todos.length === 0 ? (
          <div
            className="relative p-16 rounded-3xl overflow-hidden text-center animate-fade-in-up glass"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
              style={{ background: "#f97316" }}
            ></div>

            <div className="relative">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-glow"
                style={{
                  background: "rgba(249, 115, 22, 0.2)",
                  boxShadow: "0 0 40px rgba(249, 115, 22, 0.2)",
                }}
              >
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#f97316" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>

              <h2
                className="text-3xl font-bold mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                }}
              >
                Ready for Action
              </h2>
              <p
                className="text-lg mb-8 max-w-md mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                {goals.length > 0
                  ? "Add todos to your goals to track your daily actions."
                  : "Create a goal first, then break it down into actionable todos."}
              </p>

              <Link
                href={goals.length > 0 ? "/goals" : "/goals/new"}
                className="cursor-pointer inline-flex items-center gap-3 bg-gradient-gold px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 group"
                style={{
                  color: "var(--background-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                {goals.length > 0 ? "View Goals" : "Create Your First Goal"}
                <svg
                  className="w-6 h-6 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="space-y-6 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {overdueTodos.length > 0 && (
              <div
                className="glass p-6 rounded-2xl"
                style={{
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-4 flex items-center gap-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#ef4444",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Overdue ({overdueTodos.length})
                </h2>
                <div className="space-y-3">
                  {overdueTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {todayTodos.length > 0 && (
              <div
                className="glass p-6 rounded-2xl"
                style={{
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-4 flex items-center gap-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--gold-400)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-gradient-gold animate-pulse"></span>
                  Today ({todayTodos.length})
                </h2>
                <div className="space-y-3">
                  {todayTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {upcomingTodos.length > 0 && (
              <div
                className="glass p-6 rounded-2xl"
                style={{
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  Upcoming ({upcomingTodos.length})
                </h2>
                <div className="space-y-3">
                  {upcomingTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {noDueDateTodos.length > 0 && (
              <div
                className="glass p-6 rounded-2xl"
                style={{
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  No Due Date ({noDueDateTodos.length})
                </h2>
                <div className="space-y-3">
                  {noDueDateTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )}

            {completedTodos.length > 0 && (
              <div
                className="glass p-6 rounded-2xl"
                style={{
                  boxShadow: "var(--shadow-premium)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                <h2
                  className="text-xl font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#22c55e",
                  }}
                >
                  Completed ({completedTodos.length})
                </h2>
                <div className="space-y-3">
                  {completedTodos.slice(0, 10).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                  {completedTodos.length > 10 && (
                    <p
                      className="text-sm text-center pt-2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
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
