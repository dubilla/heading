#!/usr/bin/env node
import "tsconfig-paths/register";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { registerTools } from "@/mcp/tools";

const USER_ID = process.env.HEADING_USER_ID;
if (!USER_ID) {
  console.error("HEADING_USER_ID environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "heading",
  version: "0.1.0",
});

registerTools(server, USER_ID);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
