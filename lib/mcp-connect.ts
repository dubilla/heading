// Stand-in shown once the plaintext token is no longer available.
export const TOKEN_PLACEHOLDER = "hd_your_token_here";

export function claudeCodeSnippet(origin: string, token: string): string {
  return `claude mcp add --transport http heading ${origin}/mcp --header "Authorization: Bearer ${token}"`;
}

/**
 * Claude Desktop only launches stdio servers from its config, so a remote
 * endpoint goes through the mcp-remote bridge. The header is passed without a
 * space and the value carried in env: several clients fail to escape spaces
 * inside args, which mangles the token.
 */
export function claudeDesktopSnippet(origin: string, token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        heading: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            `${origin}/mcp`,
            "--header",
            "Authorization:${AUTH_HEADER}",
          ],
          env: { AUTH_HEADER: `Bearer ${token}` },
        },
      },
    },
    null,
    2
  );
}
