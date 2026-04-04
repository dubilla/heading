import { Command } from "commander";
import {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/db/goals";
import { getMilestonesByGoalId } from "@/lib/db/milestones";
import { getTodosByGoalId } from "@/lib/db/todos";
import { getUserId, formatDate, formatStatus, printTable } from "../utils";

export const goalsCommand = new Command("goals")
  .description("Manage goals");

goalsCommand
  .command("list")
  .description("List all goals")
  .option("-o, --objective-id <objectiveId>", "Filter by objective ID")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    let userGoals = await getGoalsByUserId(userId);

    if (opts.objectiveId) {
      userGoals = userGoals.filter((g) => g.objectiveId === opts.objectiveId);
    }

    if (userGoals.length === 0) {
      console.log("No goals found.");
      return;
    }

    printTable(
      ["ID", "Title", "Status", "Target Date", "Category"],
      userGoals.map((g) => [
        g.id.slice(0, 8),
        g.title,
        formatStatus(g.status),
        formatDate(g.targetDate),
        g.category || "—",
      ])
    );
  });

goalsCommand
  .command("get <id>")
  .description("Get a goal with milestones and todos")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const goal = await getGoalById(id, userId);

    if (!goal) {
      console.error("Goal not found.");
      process.exit(1);
    }

    console.log(`Title:       ${goal.title}`);
    console.log(`ID:          ${goal.id}`);
    console.log(`Status:      ${formatStatus(goal.status)}`);
    console.log(`Description: ${goal.description || "—"}`);
    console.log(`Target Date: ${formatDate(goal.targetDate)}`);
    console.log(`Category:    ${goal.category || "—"}`);
    console.log(`Objective:   ${goal.objectiveId || "—"}`);

    const goalMilestones = await getMilestonesByGoalId(id, userId);
    if (goalMilestones.length > 0) {
      console.log(`\nMilestones (${goalMilestones.length}):`);
      printTable(
        ["ID", "Title", "Type", "Status", "Due Date"],
        goalMilestones.map((m) => [
          m.id.slice(0, 8),
          m.title,
          m.type,
          formatStatus(m.status),
          formatDate(m.dueDate),
        ])
      );
    }

    const goalTodos = await getTodosByGoalId(id, userId);
    if (goalTodos.length > 0) {
      console.log(`\nTodos (${goalTodos.length}):`);
      printTable(
        ["ID", "Title", "Done", "Due Date"],
        goalTodos.map((t) => [
          t.id.slice(0, 8),
          t.title,
          t.completed ? "Yes" : "No",
          formatDate(t.dueDate),
        ])
      );
    }
  });

goalsCommand
  .command("create")
  .description("Create a new goal")
  .requiredOption("-t, --title <title>", "Goal title")
  .requiredOption("--target-date <date>", "Target date (YYYY-MM-DD)")
  .option("-d, --description <description>", "Goal description")
  .option("-c, --category <category>", "Goal category")
  .option("-o, --objective-id <objectiveId>", "Link to objective")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    const goal = await createGoal({
      userId,
      title: opts.title,
      description: opts.description ?? null,
      targetDate: new Date(opts.targetDate),
      category: opts.category ?? null,
      objectiveId: opts.objectiveId ?? null,
      status: "not_started",
    });
    console.log(`Created goal: ${goal.id}`);
    console.log(`Title: ${goal.title}`);
  });

goalsCommand
  .command("update <id>")
  .description("Update a goal")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("--target-date <date>", "New target date (YYYY-MM-DD)")
  .option("-c, --category <category>", "New category")
  .option("-o, --objective-id <objectiveId>", "Link to objective")
  .option(
    "-s, --status <status>",
    "New status (not_started, in_progress, on_track, off_track, completed)"
  )
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const opts = this.opts();
    const data: Record<string, unknown> = {};
    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.targetDate) data.targetDate = new Date(opts.targetDate);
    if (opts.category) data.category = opts.category;
    if (opts.objectiveId) data.objectiveId = opts.objectiveId;
    if (opts.status) data.status = opts.status;

    if (Object.keys(data).length === 0) {
      console.error("No fields to update.");
      process.exit(1);
    }

    const goal = await updateGoal(id, userId, data);
    if (!goal) {
      console.error("Goal not found.");
      process.exit(1);
    }

    console.log(`Updated goal: ${goal.id}`);
    console.log(`Title:  ${goal.title}`);
    console.log(`Status: ${formatStatus(goal.status)}`);
  });

goalsCommand
  .command("delete <id>")
  .description("Delete a goal")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const deleted = await deleteGoal(id, userId);
    if (!deleted) {
      console.error("Goal not found.");
      process.exit(1);
    }
    console.log("Goal deleted.");
  });
