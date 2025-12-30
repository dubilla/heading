import { auth } from "@/lib/auth";
import { getGoalById } from "@/lib/db/goals";
import { getMilestonesByGoalId } from "@/lib/db/milestones";
import { getTodosByGoalId } from "@/lib/db/todos";
import { calculateGoalProgress, getStatusLabel } from "@/lib/utils/progress";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { GoalActions } from "@/components/GoalActions";
import { MilestoneList } from "@/components/MilestoneList";
import { TodoList } from "@/components/TodoList";
import { ProgressBar } from "@/components/ProgressBar";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function GoalDetailPage({ params }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;
  const goal = await getGoalById(id, userId);

  if (!goal) {
    notFound();
  }

  const [milestones, todos] = await Promise.all([
    getMilestonesByGoalId(id, userId),
    getTodosByGoalId(id, userId),
  ]);

  const progress = calculateGoalProgress(goal, todos);

  const targetDate = new Date(goal.targetDate);
  const formattedDate = targetDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/goals"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Goals
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {goal.title}
                </h1>
                <StatusBadge status={goal.status} />
              </div>
              {goal.category && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {goal.category}
                </span>
              )}
            </div>
            <GoalActions goalId={goal.id} />
          </div>

          {goal.description && (
            <p className="text-gray-600 mb-4">{goal.description}</p>
          )}

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-500">
                {getStatusLabel(progress.status)}
              </span>
            </div>
            <ProgressBar
              progress={progress.actual}
              status={progress.status}
              showExpected={todos.length > 0}
              expectedProgress={progress.expected}
              size="md"
            />
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center gap-2">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Target: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {todos.filter((t) => t.completed).length}/{todos.length} todos
                completed
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MilestoneList goalId={goal.id} milestones={milestones} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TodoList todos={todos} goalId={goal.id} />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href={`/goals/${goal.id}/plan`}
            className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Plan with AI
          </Link>
        </div>
      </main>
    </div>
  );
}
