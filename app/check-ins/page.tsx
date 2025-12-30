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
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Check-ins</h1>
          <p className="text-gray-600 mt-1">
            Reflect on your progress and plan for the week ahead.
          </p>
        </div>

        {showForm ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              This Week&apos;s Check-in
            </h2>
            <CheckInForm />
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-600"
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
              <div>
                <p className="font-medium text-green-800">
                  Check-in completed for this week!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Great job reflecting on your progress. See you next week!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Check-in History
          </h2>

          {checkIns.length === 0 ? (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>No check-ins yet</p>
              <p className="text-sm mt-1">
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
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatWeekRange(weekStart)}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Current Week
                          </span>
                        )}
                      </div>
                      {checkIn.needsAdjustment && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Needs Adjustment
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">
                          Accomplishments
                        </p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                          {checkIn.accomplishments}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Challenges</p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                          {checkIn.challenges}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Next Week Priorities
                        </p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">
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
