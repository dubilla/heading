import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { ObjectiveForm } from "@/components/ObjectiveForm";
import Link from "next/link";

export default async function NewObjectivePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/objectives"
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
            Back to Objectives
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Create New Objective
          </h1>
          <p className="text-gray-600 mt-1">
            Define a high-level objective. You can add measurable goals to it
            later.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ObjectiveForm />
        </div>
      </main>
    </div>
  );
}
