import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: "var(--background-primary)" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.15) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 bg-gradient-gold" />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
        style={{ background: "var(--gold-600)" }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-3 cursor-pointer z-10"
      >
        <div
          className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center shadow-lg"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--background-primary)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </div>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          Heading
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Suspense
          fallback={
            <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
          }
        >
          <AuthForm mode="signin" />
        </Suspense>
      </div>
    </main>
  );
}
