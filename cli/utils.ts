import { Command } from "commander";

export function getUserId(cmd: Command): string {
  const root = cmd.parent ?? cmd;
  const userId =
    root.opts().user ?? process.env.HEADING_USER_ID;
  if (!userId) {
    console.error(
      "Error: User ID required. Use --user <id> or set HEADING_USER_ID env var."
    );
    process.exit(1);
  }
  return userId;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function printTable(
  headers: string[],
  rows: string[][]
): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );

  const separator = widths.map((w) => "─".repeat(w + 2)).join("┼");
  const formatRow = (row: string[]) =>
    row.map((cell, i) => ` ${(cell || "").padEnd(widths[i])} `).join("│");

  console.log(formatRow(headers));
  console.log(separator);
  rows.forEach((row) => console.log(formatRow(row)));
}
