import { auth } from "@/lib/auth";
import { getGoalsByUserIdWithLatestUpdate } from "@/lib/db/goals";
import { getMilestoneCountsForGoals } from "@/lib/db/milestones";
import { Navbar } from "@/components/Navbar";
import { GoalCard } from "@/components/GoalCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const session = await auth();
  const goals = await getGoalsByUserIdWithLatestUpdate(session!.user!.id!);
  const milestoneCounts = await getMilestoneCountsForGoals(
    goals.map((g) => g.id)
  );
  const goalsWithoutMilestones = goals.filter(
    (g) => !milestoneCounts.get(g.id) && g.status !== "completed"
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background-primary)" }}
    >
      <Navbar userName={session?.user?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12 animate-fade-in-up">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Your Goals
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Track your journey to excellence
            </p>
          </div>
          <Link
            href="/goals/new"
            className="cursor-pointer inline-flex items-center gap-2 bg-gradient-gold px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 group"
            style={{
              color: "var(--background-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:rotate-90"
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
            New Goal
          </Link>
        </div>

        {goals.length === 0 ? (
          <div
            className="relative p-16 rounded-3xl overflow-hidden text-center animate-fade-in-up glass"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-gold"></div>

            <div className="relative">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center animate-glow"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--background-primary)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
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
                Your Journey Begins Here
              </h2>
              <p
                className="text-lg mb-8 max-w-md mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Every great achievement starts with a single goal. Define your
                vision and let&apos;s transform it into reality.
              </p>

              <Link
                href="/goals/new"
                className="cursor-pointer inline-flex items-center gap-3 bg-gradient-gold px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 group"
                style={{
                  color: "var(--background-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <svg
                  className="w-6 h-6 transition-transform group-hover:rotate-90"
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
                Create Your First Goal
              </Link>

              <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                {[
                  {
                    label: "Vision",
                    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
                  },
                  {
                    label: "Strategy",
                    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                  },
                  {
                    label: "Achievement",
                    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
                  },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg glass flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: "var(--gold-400)" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {goalsWithoutMilestones.length > 0 && (
              <div
                className="mb-8 p-5 rounded-2xl glass animate-fade-in-up"
                style={{
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  background:
                    "linear-gradient(135deg, rgba(251, 146, 60, 0.05), rgba(251, 191, 36, 0.05))",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(251, 146, 60, 0.15)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--gold-400)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className="text-sm font-bold mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {goalsWithoutMilestones.length === 1
                        ? "1 goal needs milestones"
                        : `${goalsWithoutMilestones.length} goals need milestones`}
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Break goals into quarterly milestones to stay on track and
                      measure progress.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {goalsWithoutMilestones.map((goal) => (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{
                        background: "rgba(251, 191, 36, 0.1)",
                        color: "var(--gold-400)",
                        border: "1px solid rgba(251, 191, 36, 0.2)",
                      }}
                    >
                      {goal.title}
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal, index) => (
                <div
                  key={goal.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GoalCard
                    goal={goal}
                    milestoneCount={milestoneCounts.get(goal.id) ?? 0}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
