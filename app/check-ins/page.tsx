import { auth } from "@/lib/auth";
import { getRecentCheckIns, getCurrentWeekCheckIn } from "@/lib/db/check-ins";
import { Navbar } from "@/components/Navbar";
import { CheckInForm } from "@/components/CheckInForm";
import { formatWeekRange, isCurrentWeek } from "@/lib/utils/week-helpers";

export default async function CheckInsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [checkIns, currentCheckIn] = await Promise.all([
    getRecentCheckIns(userId, 20),
    getCurrentWeekCheckIn(userId),
  ]);

  const showForm = !currentCheckIn;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background-primary)" }}
    >
      <Navbar userName={session?.user?.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 animate-fade-in-up">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Weekly Check-ins
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Reflect on your progress and plan for the week ahead
          </p>
        </div>

        {showForm ? (
          <div
            className="glass p-8 rounded-2xl mb-8 animate-fade-in-up border-gradient-gold"
            style={{ boxShadow: "var(--shadow-glow)", animationDelay: "0.1s" }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              This Week&apos;s Check-in
            </h2>
            <CheckInForm />
          </div>
        ) : (
          <div
            className="glass p-6 rounded-2xl mb-8 animate-fade-in-up"
            style={{
              boxShadow: "var(--shadow-premium)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              animationDelay: "0.1s",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34, 197, 94, 0.2)" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#22c55e" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: "#22c55e" }}>
                  Check-in completed for this week!
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Great job reflecting on your progress. See you next week!
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className="glass p-8 rounded-2xl animate-fade-in-up"
          style={{
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-primary)",
            animationDelay: "0.2s",
          }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Check-in History
          </h2>

          {checkIns.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: "var(--text-tertiary)" }}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p style={{ color: "var(--text-secondary)" }}>No check-ins yet</p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Complete your first weekly check-in above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkIns.map((checkIn) => {
                const weekStart = new Date(checkIn.weekStartDate);
                const isCurrent = isCurrentWeek(weekStart);

                return (
                  <div
                    key={checkIn.id}
                    className="glass p-5 rounded-xl"
                    style={{ border: "1px solid var(--border-secondary)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-bold"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {formatWeekRange(weekStart)}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded"
                            style={{
                              background: "rgba(251, 191, 36, 0.2)",
                              color: "var(--gold-400)",
                            }}
                          >
                            Current Week
                          </span>
                        )}
                      </div>
                      {checkIn.needsAdjustment && (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{
                            background: "rgba(251, 191, 36, 0.2)",
                            color: "var(--gold-400)",
                          }}
                        >
                          Needs Adjustment
                        </span>
                      )}
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p
                          className="font-semibold mb-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Accomplishments
                        </p>
                        <p
                          className="whitespace-pre-wrap"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {checkIn.accomplishments}
                        </p>
                      </div>
                      <div>
                        <p
                          className="font-semibold mb-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Challenges
                        </p>
                        <p
                          className="whitespace-pre-wrap"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {checkIn.challenges}
                        </p>
                      </div>
                      <div>
                        <p
                          className="font-semibold mb-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Next Week Priorities
                        </p>
                        <p
                          className="whitespace-pre-wrap"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {checkIn.nextWeekPriorities}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
