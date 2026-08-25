"use client";

import { useState } from "react";
import type { TokenSummary } from "@/lib/db/tokens";
import { TOKEN_EXPIRY_OPTIONS } from "@/lib/validations/token";
import { McpConnect } from "@/components/McpConnect";

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const buttonClass =
  "cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

function fmtDate(value: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString();
}

function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const d = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return d.getTime() <= Date.now();
}

export function TokensManager({
  initialTokens,
  origin,
}: {
  initialTokens: TokenSummary[];
  origin: string;
}) {
  const [tokens, setTokens] = useState<TokenSummary[]>(initialTokens);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNewToken(null);
    setCopied(false);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch("/api/settings/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), expiresInDays }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }
      setTokens((prev) => [result.data.record, ...prev]);
      setNewToken(result.data.token);
      setName("");
    } catch {
      setError("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setError(null);
    setRevokingId(id);
    try {
      const response = await fetch(`/api/settings/tokens/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error || "Something went wrong");
        return;
      }
      setTokens((prev) => prev.filter((t) => t.id !== id));
      // Don't leave runnable snippets on screen for a token that no longer works.
      if (tokens.find((t) => t.id === id)?.last4 === newToken?.slice(-4)) {
        setNewToken(null);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the token
      // is on screen to copy manually, so this is non-fatal.
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Tokens let the CLI, MCP clients, and other tools act on your account
        over the API. Keep them secret — treat a token like a password.
      </p>

      {newToken && (
        <div
          className="rounded-md border border-green-300 bg-green-50 p-4 mb-6"
          role="status"
        >
          <p className="text-sm font-medium text-green-800 mb-2">
            Copy your new token now — you won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white border border-green-200 px-2 py-1 text-sm text-gray-900">
              {newToken}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className={buttonClass}
              aria-label="Copy token to clipboard"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-4 border-t border-green-200 pt-4">
            <McpConnect origin={origin} token={newToken} />
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="token-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Token name
            </label>
            <input
              id="token-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. laptop CLI"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="token-expiry"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expires
            </label>
            <select
              id="token-expiry"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              className={inputClass}
            >
              {TOKEN_EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={generating} className={buttonClass}>
            {generating ? "Generating..." : "Generate token"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-3" role="alert">
            {error}
          </p>
        )}
      </form>

      {tokens.length === 0 ? (
        <p className="text-sm text-gray-500">No tokens yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border-t border-gray-200">
          {tokens.map((token) => {
            const expired = isExpired(token.expiresAt);
            return (
              <li
                key={token.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {token.name}{" "}
                    <span className="font-mono text-gray-400">
                      …{token.last4}
                    </span>
                    {expired && (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-500">
                        Expired
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created {fmtDate(token.createdAt)} · Expires{" "}
                    {fmtDate(token.expiresAt)} · Last used{" "}
                    {fmtDate(token.lastUsedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(token.id)}
                  disabled={revokingId === token.id}
                  aria-label={`Revoke ${token.name}`}
                  className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revokingId === token.id ? "Revoking..." : "Revoke"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tokens.length > 0 && !newToken && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <McpConnect origin={origin} />
        </div>
      )}
    </div>
  );
}
