import { auth } from "@/lib/auth";
import { getObjectiveWithGoals } from "@/lib/db/objectives";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { ObjectiveActions } from "@/components/ObjectiveActions";
import { GoalCard } from "@/components/GoalCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ObjectiveDetailPage({ params }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;
  const result = await getObjectiveWithGoals(id, userId);

  if (!result) {
    notFound();
  }

  const { objective, goals } = result;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalGoals = goals.length;
  const progressPercentage =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background-primary)" }}
    >
      <Navbar userName={session?.user?.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 animate-fade-in-up">
          <Link
            href="/objectives"
            className="inline-flex items-center text-sm font-medium transition-colors"
            style={{ color: "var(--text-tertiary)" }}
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
            Back to Objectives
          </Link>
        </div>

        <div
          className="glass rounded-2xl p-8 mb-8 animate-fade-in-up"
          style={{
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  {objective.title}
                </h1>
                <StatusBadge status={objective.status} />
              </div>
            </div>
            <ObjectiveActions objectiveId={objective.id} />
          </div>

          {objective.description && (
            <p className="text-base mb-6" style={{ color: "var(--text-secondary)" }}>
              {objective.description}
            </p>
          )}

          {/* Progress Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Goal Progress
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                {completedGoals} / {totalGoals} goals completed
              </span>
            </div>
            <div
              className="w-full rounded-full h-2.5"
              style={{ background: "var(--border-secondary)" }}
            >
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${progressPercentage}%`,
                  background:
                    progressPercentage === 100
                      ? "#22c55e"
                      : "linear-gradient(90deg, #a855f7, #c084fc)",
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center gap-6 text-sm pt-4"
            style={{
              color: "var(--text-tertiary)",
              borderTop: "1px solid var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(168, 85, 247, 0.1)" }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#a855f7" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <span className="font-medium">{totalGoals} goals</span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Goals
          </h2>
          <Link
            href={`/goals/new?objectiveId=${objective.id}`}
            className="cursor-pointer inline-flex items-center gap-2 bg-gradient-gold px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 group"
            style={{
              color: "var(--background-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Goal
          </Link>
        </div>

        {goals.length === 0 ? (
          <div
            className="glass rounded-2xl p-12 text-center animate-fade-in-up"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-primary)",
              animationDelay: "0.2s",
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(251, 191, 36, 0.1)" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--gold-400)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              No goals yet
            </h3>
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
              Add measurable goals to track progress toward this objective.
            </p>
            <Link
              href={`/goals/new?objectiveId=${objective.id}`}
              className="cursor-pointer inline-flex items-center gap-2 font-semibold transition-colors"
              style={{ color: "var(--gold-400)" }}
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
              Add your first goal
            </Link>
          </div>
        ) : (
          <div
            className="grid gap-6 md:grid-cols-2 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
