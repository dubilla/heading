This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Remote MCP

Heading serves a hosted [MCP](https://modelcontextprotocol.io) endpoint at `POST /mcp`, so any MCP client can read and update your objectives, goals, milestones, todos, and progress updates against the deployed app — no local checkout required.

Authentication is a personal access token, minted from **Settings → Tokens**. Session cookies and the shared admin API key are deliberately not accepted on this surface. The Tokens page shows both snippets below with your origin filled in, and with the token itself filled in during the one moment it is visible after minting.

Claude Code:

```bash
claude mcp add --transport http heading https://<your-host>/mcp --header "Authorization: Bearer hd_your_token_here"
```

Claude Desktop (`claude_desktop_config.json`) — Desktop only launches stdio servers from its config, so a remote endpoint goes through the [`mcp-remote`](https://github.com/geelen/mcp-remote) bridge:

```json
{
  "mcpServers": {
    "heading": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<your-host>/mcp",
        "--header",
        "Authorization:${AUTH_HEADER}"
      ],
      "env": { "AUTH_HEADER": "Bearer hd_your_token_here" }
    }
  }
}
```

The header name is passed without a trailing space and the value carried in `env` on purpose: several clients don't escape spaces inside `args`, which mangles the token.

Custom connectors on claude.ai web are **not** supported — they require OAuth, and this endpoint authenticates with tokens only. Clients that send custom headers work directly.

The same tools are also available over stdio for local use: `HEADING_USER_ID=<id> npm run mcp`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
