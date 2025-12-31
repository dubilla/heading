import { auth } from "@/lib/auth";
import { getGoalById } from "@/lib/db/goals";
import { Navbar } from "@/components/Navbar";
import { GoalForm } from "@/components/GoalForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditGoalPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const goal = await getGoalById(id, session!.user!.id!);

  if (!goal) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/goals/${goal.id}`}
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
            Back to Goal
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Edit Goal</h1>
          <p className="text-gray-600 mt-1">Update your goal details.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <GoalForm goal={goal} />
        </div>
      </main>
    </div>
  );
}
