"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Something went wrong");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  const inputClassName = [
    "mt-1 block w-full rounded-lg px-4 py-3",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2",
    "placeholder:opacity-40",
  ].join(" ");

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div
        className="rounded-2xl p-8 glass"
        style={{
          boxShadow: "var(--shadow-elevation)",
          border: "1px solid var(--border-gold)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            {mode === "signin" ? "Welcome Back" : "Begin Your Ascent"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <a
                  href="/auth/signup"
                  className="font-semibold cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: "var(--gold-400)" }}
                >
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a
                  href="/auth/signin"
                  className="font-semibold cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: "var(--gold-400)" }}
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm animate-fade-in"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={inputClassName}
                  style={{
                    background: "var(--background-secondary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--gold-500)";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(251, 191, 36, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-primary)";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClassName}
                style={{
                  background: "var(--background-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--gold-500)";
                  e.target.style.boxShadow =
                    "0 0 0 2px rgba(251, 191, 36, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-primary)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                className={inputClassName}
                style={{
                  background: "var(--background-secondary)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--gold-500)";
                  e.target.style.boxShadow =
                    "0 0 0 2px rgba(251, 191, 36, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-primary)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-gold"
            style={{
              color: "var(--background-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            {loading
              ? "Loading..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{
                  borderTop: "1px solid var(--border-primary)",
                }}
              />
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                className="px-3"
                style={{
                  background: "var(--background-tertiary)",
                  color: "var(--text-tertiary)",
                }}
              >
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full cursor-pointer flex items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "var(--background-secondary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-gold)";
              e.currentTarget.style.background = "var(--background-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-primary)";
              e.currentTarget.style.background = "var(--background-secondary)";
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </form>
      </div>
    </div>
  );
}
