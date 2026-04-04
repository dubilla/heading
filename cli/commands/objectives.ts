import { Command } from "commander";
import {
  getObjectivesByUserId,
  getObjectiveWithGoals,
  createObjective,
  updateObjective,
  deleteObjective,
} from "@/lib/db/objectives";
import { getUserId, formatDate, formatStatus, printTable } from "../utils";

export const objectivesCommand = new Command("objectives")
  .alias("obj")
  .description("Manage objectives");

objectivesCommand
  .command("list")
  .description("List all objectives")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const objs = await getObjectivesByUserId(userId);

    if (objs.length === 0) {
      console.log("No objectives found.");
      return;
    }

    printTable(
      ["ID", "Title", "Status", "Created"],
      objs.map((o) => [
        o.id.slice(0, 8),
        o.title,
        formatStatus(o.status),
        formatDate(o.createdAt),
      ])
    );
  });

objectivesCommand
  .command("get <id>")
  .description("Get an objective with its goals")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const result = await getObjectiveWithGoals(id, userId);

    if (!result) {
      console.error("Objective not found.");
      process.exit(1);
    }

    const { objective, goals } = result;
    console.log(`Title:       ${objective.title}`);
    console.log(`ID:          ${objective.id}`);
    console.log(`Status:      ${formatStatus(objective.status)}`);
    console.log(`Description: ${objective.description || "—"}`);
    console.log(`Created:     ${formatDate(objective.createdAt)}`);
    console.log(`Updated:     ${formatDate(objective.updatedAt)}`);

    if (goals.length > 0) {
      console.log(`\nGoals (${goals.length}):`);
      printTable(
        ["ID", "Title", "Status", "Target Date"],
        goals.map((g) => [
          g.id.slice(0, 8),
          g.title,
          formatStatus(g.status),
          formatDate(g.targetDate),
        ])
      );
    } else {
      console.log("\nNo goals linked to this objective.");
    }
  });

objectivesCommand
  .command("create")
  .description("Create a new objective")
  .requiredOption("-t, --title <title>", "Objective title")
  .option("-d, --description <description>", "Objective description")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    const objective = await createObjective({
      userId,
      title: opts.title,
      description: opts.description ?? null,
      status: "not_started",
    });
    console.log(`Created objective: ${objective.id}`);
    console.log(`Title: ${objective.title}`);
  });

objectivesCommand
  .command("update <id>")
  .description("Update an objective")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option(
    "-s, --status <status>",
    "New status (not_started, in_progress, on_track, off_track, completed)"
  )
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const opts = this.opts();
    const data: Record<string, string> = {};
    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.status) data.status = opts.status;

    if (Object.keys(data).length === 0) {
      console.error("No fields to update. Use --title, --description, or --status.");
      process.exit(1);
    }

    const objective = await updateObjective(id, userId, data);
    if (!objective) {
      console.error("Objective not found.");
      process.exit(1);
    }

    console.log(`Updated objective: ${objective.id}`);
    console.log(`Title:  ${objective.title}`);
    console.log(`Status: ${formatStatus(objective.status)}`);
  });

objectivesCommand
  .command("delete <id>")
  .description("Delete an objective")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const deleted = await deleteObjective(id, userId);
    if (!deleted) {
      console.error("Objective not found.");
      process.exit(1);
    }
    console.log("Objective deleted.");
  });
