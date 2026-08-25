"use client";

import { useState } from "react";
import {
  claudeCodeSnippet,
  claudeDesktopSnippet,
  TOKEN_PLACEHOLDER,
} from "@/lib/mcp-connect";

function Snippet({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the
      // snippet is on screen to copy manually, so this is non-fatal.
    }
  };

  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label} snippet to clipboard`}
          className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded bg-gray-900 px-3 py-2 text-xs text-gray-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function McpConnect({
  origin,
  token,
}: {
  origin: string;
  /** The plaintext token when it is still visible, otherwise a placeholder. */
  token?: string;
}) {
  const value = token ?? TOKEN_PLACEHOLDER;

  return (
    <div>
      <p className="text-sm font-medium text-gray-900">Connect an MCP client</p>
      <p className="text-xs text-gray-500 mt-0.5 mb-3">
        {token
          ? "Run this now while the token is still on screen."
          : `Replace ${TOKEN_PLACEHOLDER} with a token you generated above.`}
      </p>

      {/* Keyed so a new token resets each button out of its "Copied" state. */}
      <Snippet
        key={`code-${value}`}
        label="Claude Code"
        value={claudeCodeSnippet(origin, value)}
      />
      <Snippet
        key={`desktop-${value}`}
        label="Claude Desktop (claude_desktop_config.json)"
        value={claudeDesktopSnippet(origin, value)}
      />
    </div>
  );
}
