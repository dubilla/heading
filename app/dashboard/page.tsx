import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { getGoalsByUserId, getGoalStats } from "@/lib/db/goals";
import { getTodosByUserId, getTodoStats } from "@/lib/db/todos";
import { getCurrentWeekCheckIn } from "@/lib/db/check-ins";
import { getObjectivesWithGoals, getObjectiveStats } from "@/lib/db/objectives";
import { GoalCard } from "@/components/GoalCard";
import { ObjectiveCard } from "@/components/ObjectiveCard";
import { TodoItem } from "@/components/TodoItem";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [
    goals,
    goalStats,
    todos,
    todoStats,
    currentCheckIn,
    objectivesWithGoals,
    objectiveStats,
  ] = await Promise.all([
    getGoalsByUserId(userId),
    getGoalStats(userId),
    getTodosByUserId(userId, { completed: false }),
    getTodoStats(userId),
    getCurrentWeekCheckIn(userId),
    getObjectivesWithGoals(userId),
    getObjectiveStats(userId),
  ]);

  // Filter standalone goals (not linked to any objective)
  const standaloneGoals = goals.filter((g) => !g.objectiveId);
  const recentStandaloneGoals = standaloneGoals.slice(0, 3);
  const recentObjectives = objectivesWithGoals.slice(0, 3);
  const recentTodos = todos.slice(0, 5);
  const hasCompletedCheckIn = !!currentCheckIn;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="text-gray-600 mt-1">
            Track your progress and stay on top of your goals.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Objectives</h3>
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {objectiveStats.total}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {objectiveStats.completed} completed
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Goals</h3>
              <svg
                className="w-5 h-5 text-blue-500"
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
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {goalStats.total}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {goalStats.completed} completed
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Pending Todos
              </h3>
              <svg
                className="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {todoStats.pending}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {todoStats.dueThisWeek} due this week
            </p>
          </div>

          <Link
            href="/check-ins"
            className={`rounded-xl shadow-sm border p-6 transition-colors ${
              hasCompletedCheckIn
                ? "bg-green-50 border-green-200 hover:bg-green-100"
                : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Weekly Check-in
              </h3>
              <svg
                className={`w-5 h-5 ${hasCompletedCheckIn ? "text-green-500" : "text-yellow-500"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            {hasCompletedCheckIn ? (
              <>
                <p className="text-3xl font-bold text-green-600 mt-2">Done</p>
                <p className="text-sm text-green-600 mt-1">
                  Completed this week
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  Pending
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Click to check in
                </p>
              </>
            )}
          </Link>
        </div>

        {/* Objectives Section */}
        {objectivesWithGoals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Objectives
              </h2>
              <Link
                href="/objectives"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentObjectives.map(({ objective, goals: objGoals }) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  goals={objGoals}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {objectivesWithGoals.length > 0
                  ? "Standalone Goals"
                  : "Your Goals"}
              </h2>
              <Link
                href="/goals/new"
                className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create Goal
              </Link>
            </div>
            {recentStandaloneGoals.length === 0 ? (
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
                <p>
                  {objectivesWithGoals.length > 0
                    ? "No standalone goals"
                    : "No goals yet"}
                </p>
                <Link
                  href="/goals/new"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  Create your first goal
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentStandaloneGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
                {standaloneGoals.length > 3 && (
                  <Link
                    href="/goals"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
                  >
                    View all {standaloneGoals.length} standalone goals
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Todos
              </h2>
              <Link
                href="/todos"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            {recentTodos.length === 0 ? (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p>No todos yet</p>
                <p className="text-sm mt-1">
                  Create a goal and add todos to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
                {todos.length > 5 && (
                  <Link
                    href="/todos"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
                  >
                    View all {todos.length} pending todos
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
