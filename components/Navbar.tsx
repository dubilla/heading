"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavbarProps {
  userName?: string | null;
}

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/objectives", label: "Objectives" },
    { href: "/goals", label: "Goals" },
    { href: "/todos", label: "Todos" },
    { href: "/check-ins", label: "Check-ins" },
  ];

  return (
    <nav
      style={{
        background: "var(--background-secondary)",
        borderBottom: "1px solid var(--border-primary)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-9 h-9 bg-gradient-gold rounded-lg flex items-center justify-center"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <svg
                  className="w-5 h-5"
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
                className="text-xl font-bold tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                }}
              >
                Heading
              </span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" &&
                    pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-all rounded-lg"
                    style={{
                      color: isActive
                        ? "var(--text-accent)"
                        : "var(--text-secondary)",
                      background: isActive
                        ? "rgba(251, 191, 36, 0.1)"
                        : "transparent",
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-gold rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center font-bold text-sm"
                style={{ color: "var(--background-primary)" }}
              >
                {(userName || "U").charAt(0).toUpperCase()}
              </div>
              <span
                className="text-sm font-medium hidden md:block"
                style={{ color: "var(--text-secondary)" }}
              >
                {userName || "User"}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-white/5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
