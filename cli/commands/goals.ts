import { Command } from "commander";
import type { Goal, Milestone, Todo, ProgressUpdate } from "@/lib/db/schema";
import { calculateValueProgress } from "@/lib/utils/progress";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";
import { formatDate, formatStatus, printTable } from "../utils";

export const goalsCommand = new Command("goals").description("Manage goals");

goalsCommand
  .command("list")
  .description("List all goals")
  .option("-o, --objective-id <objectiveId>", "Filter by objective ID")
  .action(async function (this: Command) {
    const opts = this.opts();
    let userGoals = await apiGet<Goal[]>("/api/goals");

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
  .action(async (id: string) => {
    const goal = await apiGet<Goal>(`/api/goals/${id}`);

    console.log(`Title:       ${goal.title}`);
    console.log(`ID:          ${goal.id}`);
    console.log(`Status:      ${formatStatus(goal.status)}`);
    console.log(`Description: ${goal.description || "—"}`);
    console.log(`Target Date: ${formatDate(goal.targetDate)}`);
    console.log(`Category:    ${goal.category || "—"}`);
    console.log(`Objective:   ${goal.objectiveId || "—"}`);

    const goalMilestones = await apiGet<Milestone[]>(
      `/api/goals/${id}/milestones`
    );
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

    const goalTodos = await apiGet<Todo[]>(`/api/todos?goalId=${id}`);
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
  .option("--start-value <n>", "Start value for progress tracking", "0")
  .option("--target-value <n>", "Target value for progress tracking", "100")
  .option("--unit <unit>", "Unit label for progress (e.g. %, novels, lbs)", "%")
  .action(async function (this: Command) {
    const opts = this.opts();
    const goal = await apiPost<Goal>("/api/goals", {
      title: opts.title,
      description: opts.description ?? null,
      targetDate: opts.targetDate,
      category: opts.category ?? null,
      objectiveId: opts.objectiveId ?? null,
      startValue: Number(opts.startValue),
      targetValue: Number(opts.targetValue),
      unit: opts.unit,
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
  .option("--start-value <n>", "New start value")
  .option("--target-value <n>", "New target value")
  .option("--unit <unit>", "New unit label")
  .action(async function (this: Command, id: string) {
    const opts = this.opts();
    const data: Record<string, unknown> = {};
    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.targetDate) data.targetDate = opts.targetDate;
    if (opts.category) data.category = opts.category;
    if (opts.objectiveId) data.objectiveId = opts.objectiveId;
    if (opts.status) data.status = opts.status;
    if (opts.startValue !== undefined)
      data.startValue = Number(opts.startValue);
    if (opts.targetValue !== undefined)
      data.targetValue = Number(opts.targetValue);
    if (opts.unit !== undefined) data.unit = opts.unit;

    if (Object.keys(data).length === 0) {
      console.error("No fields to update.");
      process.exit(1);
    }

    const goal = await apiPatch<Goal>(`/api/goals/${id}`, data);
    console.log(`Updated goal: ${goal.id}`);
    console.log(`Title:  ${goal.title}`);
    console.log(`Status: ${formatStatus(goal.status)}`);
  });

goalsCommand
  .command("delete <id>")
  .description("Delete a goal")
  .action(async (id: string) => {
    await apiDelete(`/api/goals/${id}`);
    console.log("Goal deleted.");
  });

// --- Progress updates ---

const progressCommand = goalsCommand
  .command("progress")
  .description("Manage progress updates on a goal");

progressCommand
  .command("list <goalId>")
  .description("List all progress updates for a goal")
  .action(async (goalId: string) => {
    const updates = await apiGet<ProgressUpdate[]>(
      `/api/goals/${goalId}/progress-updates`
    );
    if (updates.length === 0) {
      console.log("No progress updates yet.");
      return;
    }
    const goal = await apiGet<Goal>(`/api/goals/${goalId}`);
    printTable(
      ["ID", "Value", "%", "Occurred", "Note"],
      updates.map((u) => [
        u.id.slice(0, 8),
        `${u.value}${goal.unit ? ` ${goal.unit}` : ""}`,
        `${calculateValueProgress(u.value, goal.startValue, goal.targetValue)}%`,
        formatDate(u.occurredAt),
        u.note ? u.note.slice(0, 40) : "—",
      ])
    );
  });

progressCommand
  .command("create <goalId>")
  .description("Log a new progress update on a goal")
  .requiredOption("-v, --value <n>", "Numeric value for the update")
  .option("-n, --note <note>", "Optional note")
  .option(
    "--occurred-at <date>",
    "When the progress happened (YYYY-MM-DD, defaults to today)"
  )
  .action(async function (this: Command, goalId: string) {
    const opts = this.opts();
    const update = await apiPost<ProgressUpdate>(
      `/api/goals/${goalId}/progress-updates`,
      {
        value: Number(opts.value),
        note: opts.note ?? null,
        ...(opts.occurredAt ? { occurredAt: opts.occurredAt } : {}),
      }
    );
    console.log(`Logged progress update: ${update.id}`);
    console.log(`Value: ${update.value}`);
    console.log(`Occurred: ${formatDate(update.occurredAt)}`);
  });

progressCommand
  .command("update <goalId> <updateId>")
  .description("Edit an existing progress update")
  .option("-v, --value <n>", "New value")
  .option("-n, --note <note>", "New note")
  .option("--occurred-at <date>", "New occurred-at date (YYYY-MM-DD)")
  .action(async function (this: Command, goalId: string, updateId: string) {
    const opts = this.opts();
    const data: Record<string, unknown> = {};
    if (opts.value !== undefined) data.value = Number(opts.value);
    if (opts.note !== undefined) data.note = opts.note;
    if (opts.occurredAt) data.occurredAt = opts.occurredAt;

    if (Object.keys(data).length === 0) {
      console.error("No fields to update.");
      process.exit(1);
    }

    const update = await apiPatch<ProgressUpdate>(
      `/api/goals/${goalId}/progress-updates/${updateId}`,
      data
    );
    console.log(`Updated progress update: ${update.id}`);
  });

progressCommand
  .command("delete <goalId> <updateId>")
  .description("Delete a progress update")
  .action(async (goalId: string, updateId: string) => {
    await apiDelete(`/api/goals/${goalId}/progress-updates/${updateId}`);
    console.log("Progress update deleted.");
  });
