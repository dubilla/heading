import { Command } from "commander";
import {
  getMilestonesByGoalId,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/lib/db/milestones";
import { getUserId, formatDate, formatStatus, printTable } from "../utils";

export const milestonesCommand = new Command("milestones")
  .alias("ms")
  .description("Manage milestones");

milestonesCommand
  .command("list <goalId>")
  .description("List milestones for a goal")
  .action(async function (this: Command, goalId: string) {
    const userId = getUserId(this);
    const items = await getMilestonesByGoalId(goalId, userId);

    if (items.length === 0) {
      console.log("No milestones found.");
      return;
    }

    printTable(
      ["ID", "Title", "Type", "Status", "Due Date", "Q", "M"],
      items.map((m) => [
        m.id.slice(0, 8),
        m.title,
        m.type,
        formatStatus(m.status),
        formatDate(m.dueDate),
        m.quarter?.toString() || "—",
        m.month?.toString() || "—",
      ])
    );
  });

milestonesCommand
  .command("get <id>")
  .description("Get a milestone")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const milestone = await getMilestoneById(id, userId);

    if (!milestone) {
      console.error("Milestone not found.");
      process.exit(1);
    }

    console.log(`Title:       ${milestone.title}`);
    console.log(`ID:          ${milestone.id}`);
    console.log(`Goal ID:     ${milestone.goalId}`);
    console.log(`Type:        ${milestone.type}`);
    console.log(`Status:      ${formatStatus(milestone.status)}`);
    console.log(`Description: ${milestone.description || "—"}`);
    console.log(`Due Date:    ${formatDate(milestone.dueDate)}`);
    console.log(`Quarter:     ${milestone.quarter ?? "—"}`);
    console.log(`Month:       ${milestone.month ?? "—"}`);
  });

milestonesCommand
  .command("create")
  .description("Create a milestone")
  .requiredOption("-g, --goal-id <goalId>", "Goal ID")
  .requiredOption("-t, --title <title>", "Title")
  .requiredOption("--due-date <date>", "Due date (YYYY-MM-DD)")
  .requiredOption("--type <type>", "Type (quarterly or monthly)")
  .option("-d, --description <description>", "Description")
  .option("-q, --quarter <quarter>", "Quarter (1-4)", parseInt)
  .option("-m, --month <month>", "Month (1-12)", parseInt)
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    const milestone = await createMilestone(
      {
        goalId: opts.goalId,
        title: opts.title,
        description: opts.description ?? null,
        dueDate: new Date(opts.dueDate),
        type: opts.type,
        quarter: opts.quarter ?? null,
        month: opts.month ?? null,
        status: "not_started",
      },
      userId
    );

    if (!milestone) {
      console.error("Failed to create milestone. Check that the goal exists.");
      process.exit(1);
    }

    console.log(`Created milestone: ${milestone.id}`);
    console.log(`Title: ${milestone.title}`);
  });

milestonesCommand
  .command("update <id>")
  .description("Update a milestone")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("--due-date <date>", "New due date (YYYY-MM-DD)")
  .option(
    "-s, --status <status>",
    "New status (not_started, in_progress, completed, off_track)"
  )
  .option("-q, --quarter <quarter>", "Quarter (1-4)", parseInt)
  .option("-m, --month <month>", "Month (1-12)", parseInt)
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const opts = this.opts();
    const data: Record<string, unknown> = {};
    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.dueDate) data.dueDate = new Date(opts.dueDate);
    if (opts.status) data.status = opts.status;
    if (opts.quarter !== undefined) data.quarter = opts.quarter;
    if (opts.month !== undefined) data.month = opts.month;

    if (Object.keys(data).length === 0) {
      console.error("No fields to update.");
      process.exit(1);
    }

    const milestone = await updateMilestone(id, userId, data);
    if (!milestone) {
      console.error("Milestone not found.");
      process.exit(1);
    }

    console.log(`Updated milestone: ${milestone.id}`);
    console.log(`Title:  ${milestone.title}`);
    console.log(`Status: ${formatStatus(milestone.status)}`);
  });

milestonesCommand
  .command("delete <id>")
  .description("Delete a milestone")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const deleted = await deleteMilestone(id, userId);
    if (!deleted) {
      console.error("Milestone not found.");
      process.exit(1);
    }
    console.log("Milestone deleted.");
  });
