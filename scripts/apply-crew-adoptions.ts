/**
 * Apply a reviewed goal-audit file: adopt Crew tasks onto Heading goals.
 *
 * Reads the `- link task:<uuid> goal:<uuid> | <title> | <confidence> | <reason>`
 * lines produced by Crew's scripts/audit-goal-work.ts (after the user has
 * edited the file), and for each one runs the native adopt path
 * (linkExistingCrewTask): create an origin:"crew" todo under the goal, then
 * stamp the Crew task via POST /api/v1/tasks/[id]/link — which also caches
 * the goal id/title on the Crew task for display.
 *
 * Dry run by default; pass --apply to write. Idempotent: tasks that already
 * have a todo (matched by crewTaskId) are skipped, so re-running after a
 * partial failure only processes the remainder.
 *
 * Usage:
 *   DATABASE_URL=<heading db> CREW_API_URL=<crew url> CREW_INTEGRATION_TOKEN=<token> \
 *     npx tsx scripts/apply-crew-adoptions.ts <review-file> [--apply]
 */
import "tsconfig-paths/register";
import fs from "fs";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { goals, todos } from "@/lib/db/schema";
import { linkExistingCrewTask } from "@/lib/db/todos";
import { crewConfig } from "@/lib/integrations/crew";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const filePath = args.find((a) => !a.startsWith("--"));

if (!filePath || !fs.existsSync(filePath)) {
  console.error(
    "Usage: npx tsx scripts/apply-crew-adoptions.ts <review-file> [--apply]"
  );
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL to the Heading database.");
  process.exit(1);
}
if (!crewConfig()) {
  console.error(
    "Set CREW_API_URL and CREW_INTEGRATION_TOKEN for the Crew API."
  );
  process.exit(1);
}

console.log(`Heading DB: ${new URL(process.env.DATABASE_URL).host}`);
console.log(`Crew API:   ${process.env.CREW_API_URL}`);
console.log(apply ? "Mode: APPLY" : "Mode: dry run (pass --apply to write)");

type Line = { crewTaskId: string; goalId: string; title: string; raw: string };

// Title may itself contain " | ", so split from the right: the last two
// fields are confidence and reason; everything between the ids and those
// two fields is the title.
function parseLine(raw: string): Line | null {
  const m = /^- link task:([0-9a-f-]{36}) goal:([0-9a-f-]{36}) \| (.+)$/.exec(
    raw
  );
  if (!m) return null;
  const fields = m[3].split(" | ");
  const title = (fields.length >= 3 ? fields.slice(0, -2) : fields)
    .join(" | ")
    .trim();
  return { crewTaskId: m[1], goalId: m[2], title, raw };
}

async function main() {
  const lines = fs
    .readFileSync(filePath!, "utf8")
    .split("\n")
    .map(parseLine)
    .filter((l): l is Line => l !== null);

  if (lines.length === 0) {
    console.error("No `- link task:... goal:...` lines found in the file.");
    process.exit(1);
  }

  // Resolve the referenced goals (and their owner) up front so a typo'd
  // goal id fails the whole run before anything is written.
  const goalIds = [...new Set(lines.map((l) => l.goalId))];
  const goalRows = await db.query.goals.findMany({
    where: inArray(goals.id, goalIds),
  });
  const goalById = new Map(goalRows.map((g) => [g.id, g]));
  const missing = goalIds.filter((id) => !goalById.has(id));
  if (missing.length > 0) {
    console.error(
      `Unknown goal id(s) in the review file:\n  ${missing.join("\n  ")}`
    );
    process.exit(1);
  }

  // Idempotency: skip tasks that already have a todo.
  const alreadyLinked = await db.query.todos.findMany({
    where: inArray(
      todos.crewTaskId,
      lines.map((l) => l.crewTaskId)
    ),
  });
  const linkedTaskIds = new Set(alreadyLinked.map((t) => t.crewTaskId));

  const pending = lines.filter((l) => !linkedTaskIds.has(l.crewTaskId));
  const skipped = lines.length - pending.length;

  console.log(
    `\n${lines.length} link line(s) parsed; ${skipped} already adopted (skipped); ${pending.length} to apply.\n`
  );

  for (const goalId of goalIds) {
    const goal = goalById.get(goalId)!;
    const forGoal = pending.filter((l) => l.goalId === goalId);
    if (forGoal.length === 0) continue;
    console.log(`${goal.title} (${forGoal.length}):`);
    for (const l of forGoal) console.log(`  - ${l.title}`);
  }

  if (!apply) {
    console.log("\nDry run complete — nothing written. Re-run with --apply.");
    return;
  }

  let ok = 0;
  const failures: { line: Line; reason: string }[] = [];
  for (const l of pending) {
    const goal = goalById.get(l.goalId)!;
    const result = await linkExistingCrewTask(
      { goalId: l.goalId, crewTaskId: l.crewTaskId, title: l.title },
      goal.userId
    );
    if (result.ok) {
      ok++;
      console.log(`  ok       ${l.title}`);
    } else {
      failures.push({ line: l, reason: result.reason });
      console.error(`  ${result.reason.padEnd(8)} ${l.title}`);
    }
  }

  console.log(
    `\nDone: ${ok} adopted, ${failures.length} failed, ${skipped} previously adopted.`
  );
  if (failures.length > 0) {
    console.log(
      "Failures leave no partial state (the local todo is rolled back) — fix and re-run; adopted lines are skipped automatically."
    );
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    // pg Pool keeps the process alive otherwise.
    setTimeout(() => process.exit(process.exitCode ?? 0), 100);
  });
