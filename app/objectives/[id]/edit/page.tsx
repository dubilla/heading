import { auth } from "@/lib/auth";
import { getObjectiveById } from "@/lib/db/objectives";
import { Navbar } from "@/components/Navbar";
import { ObjectiveForm } from "@/components/ObjectiveForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditObjectivePage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const objective = await getObjectiveById(id, session!.user!.id!);

  if (!objective) {
    notFound();
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background-primary)" }}
    >
      <Navbar userName={session?.user?.name} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 animate-fade-in-up">
          <Link
            href={`/objectives/${id}`}
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
            Back to Objective
          </Link>
          <h1
            className="text-3xl font-bold mt-4 mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Edit Objective
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Update your objective details.
          </p>
        </div>

        <div
          className="glass rounded-2xl p-8 animate-fade-in-up"
          style={{
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-primary)",
            animationDelay: "0.1s",
          }}
        >
          <ObjectiveForm objective={objective} />
        </div>
      </main>
    </div>
  );
}
