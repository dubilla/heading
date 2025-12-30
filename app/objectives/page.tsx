import { auth } from "@/lib/auth";
import { getObjectivesWithGoals } from "@/lib/db/objectives";
import { Navbar } from "@/components/Navbar";
import { ObjectiveCard } from "@/components/ObjectiveCard";
import Link from "next/link";

export default async function ObjectivesPage() {
  const session = await auth();
  const objectivesWithGoals = await getObjectivesWithGoals(session!.user!.id!);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Your Objectives
            </h1>
            <p className="text-gray-600 mt-1">
              High-level objectives that contain your measurable goals
            </p>
          </div>
          <Link
            href="/objectives/new"
            className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Objective
          </Link>
        </div>

        {objectivesWithGoals.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No objectives yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first objective to organize your goals.
            </p>
            <Link
              href="/objectives/new"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Objective
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {objectivesWithGoals.map(({ objective, goals }) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                goals={goals}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
