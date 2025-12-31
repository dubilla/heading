import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden"
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
        ></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-gradient-gold"></div>
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-10"
        style={{ background: "var(--gold-600)" }}
      ></div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/auth/signin"
            className="font-medium transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="cursor-pointer bg-gradient-gold px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-lg"
            style={{
              color: "var(--background-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 rounded-full glass border-gradient-gold">
            <span className="text-sm font-semibold text-gradient-gold">
              FOR HIGH ACHIEVERS
            </span>
          </div>

          <h1
            className="text-7xl font-bold mb-8 leading-tight tracking-tight animate-fade-in-up"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              animationDelay: "0.1s",
            }}
          >
            Become Who You&apos;re
            <br />
            <span className="text-gradient-gold">Meant to Be</span>
          </h1>

          <p
            className="text-xl mb-12 leading-relaxed animate-fade-in-up"
            style={{
              color: "var(--text-secondary)",
              animationDelay: "0.2s",
              maxWidth: "700px",
              margin: "0 auto 3rem",
            }}
          >
            The achievement platform for ambitious people who refuse to settle.
            Transform your boldest aspirations into systematic progress with
            AI-powered planning.
          </p>

          <div
            className="flex items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/auth/signup"
              className="cursor-pointer group relative inline-flex items-center gap-3 bg-gradient-gold px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105"
              style={{
                color: "var(--background-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Start Your Ascent
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-white/5"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              number: "10x",
              label: "More Likely to Achieve Goals",
              delay: "0s",
            },
            {
              number: "365",
              label: "Days of Systematic Progress",
              delay: "0.1s",
            },
            { number: "100%", label: "Focused on Your Growth", delay: "0.2s" },
          ].map((stat, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{ animationDelay: stat.delay }}
            >
              <div
                className="text-5xl font-bold mb-2 text-gradient-gold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stat.number}
              </div>
              <div
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24"
      >
        <div className="text-center mb-16">
          <h2
            className="text-5xl font-bold mb-4"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Your Path to Excellence
          </h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            A proven system for turning ambition into achievement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Define Your Vision",
              description:
                "Set ambitious annual goals that align with who you want to become. No more settling for incremental progress.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              delay: "0s",
            },
            {
              step: "02",
              title: "AI-Powered Strategy",
              description:
                "Our intelligent planning assistant breaks down your vision into quarterly milestones and actionable monthly targets.",
              icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
              delay: "0.1s",
            },
            {
              step: "03",
              title: "Execute with Precision",
              description:
                "Track your progress daily, stay accountable with weekly check-ins, and watch yourself transform into the person you aspire to be.",
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              delay: "0.2s",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative p-8 rounded-2xl glass transition-all hover:scale-105 animate-fade-in-up group cursor-pointer"
              style={{
                animationDelay: item.delay,
                boxShadow: "var(--shadow-premium)",
              }}
            >
              <div
                className="absolute top-6 right-6 text-6xl font-bold opacity-10"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--gold-500)",
                }}
              >
                {item.step}
              </div>

              <div className="relative mb-6">
                <div
                  className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--background-primary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                </div>
              </div>

              <h3
                className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                }}
              >
                {item.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div
          className="relative p-12 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--background-elevated) 0%, var(--background-secondary) 100%)",
            border: "1px solid var(--border-gold)",
            boxShadow: "var(--shadow-elevation)",
          }}
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-30 bg-gradient-gold"></div>

          <div className="relative text-center">
            <h2
              className="text-5xl font-bold mb-6"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Ready to Transform?
            </h2>
            <p
              className="text-xl mb-10"
              style={{
                color: "var(--text-secondary)",
                maxWidth: "600px",
                margin: "0 auto 2.5rem",
              }}
            >
              Join the ranks of high achievers who&apos;ve stopped dreaming and
              started doing. Your future self is waiting.
            </p>
            <Link
              href="/auth/signup"
              className="cursor-pointer inline-flex items-center gap-3 bg-gradient-gold px-10 py-5 rounded-xl text-xl font-bold transition-all hover:scale-105 group"
              style={{
                color: "var(--background-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Begin Your Journey
              <svg
                className="w-6 h-6 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 py-12 mt-16"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        <div
          className="max-w-7xl mx-auto px-6 text-center"
          style={{ color: "var(--text-tertiary)" }}
        >
          <p>&copy; {new Date().getFullYear()} Heading. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
