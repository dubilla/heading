import { auth } from "@/lib/auth";
import { getObjectivesWithGoals } from "@/lib/db/objectives";
import { Navbar } from "@/components/Navbar";
import { ObjectiveCard } from "@/components/ObjectiveCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ObjectivesPage() {
  const session = await auth();
  const objectivesWithGoals = await getObjectivesWithGoals(session!.user!.id!);

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
              Your Objectives
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              High-level objectives that contain your measurable goals
            </p>
          </div>
          <Link
            href="/objectives/new"
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
            New Objective
          </Link>
        </div>

        {objectivesWithGoals.length === 0 ? (
          <div
            className="relative p-16 rounded-3xl overflow-hidden text-center animate-fade-in-up glass"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
              style={{ background: "#a855f7" }}
            ></div>

            <div className="relative">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-glow"
                style={{
                  background: "rgba(168, 85, 247, 0.2)",
                  boxShadow: "0 0 40px rgba(168, 85, 247, 0.2)",
                }}
              >
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#a855f7" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
                Set Your Strategic Objectives
              </h2>
              <p
                className="text-lg mb-8 max-w-md mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Group related goals into objectives to maintain focus on what
                truly matters.
              </p>

              <Link
                href="/objectives/new"
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
                Create Your First Objective
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {objectivesWithGoals.map(({ objective, goals }, index) => (
              <div
                key={objective.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ObjectiveCard objective={objective} goals={goals} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
