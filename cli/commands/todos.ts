import { Command } from "commander";
import {
  getTodosByUserId,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from "@/lib/db/todos";
import { getUserId, formatDate, printTable } from "../utils";

export const todosCommand = new Command("todos").description("Manage todos");

todosCommand
  .command("list")
  .description("List todos")
  .option("-g, --goal-id <goalId>", "Filter by goal ID")
  .option("-m, --milestone-id <milestoneId>", "Filter by milestone ID")
  .option("--completed", "Show only completed todos")
  .option("--pending", "Show only pending todos")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    const items = await getTodosByUserId(userId, {
      goalId: opts.goalId,
      milestoneId: opts.milestoneId,
      completed: opts.completed ? true : opts.pending ? false : undefined,
    });

    if (items.length === 0) {
      console.log("No todos found.");
      return;
    }

    printTable(
      ["ID", "Title", "Done", "Due Date", "Goal ID"],
      items.map((t) => [
        t.id.slice(0, 8),
        t.title,
        t.completed ? "Yes" : "No",
        formatDate(t.dueDate),
        t.goalId.slice(0, 8),
      ])
    );
  });

todosCommand
  .command("get <id>")
  .description("Get a todo")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const todo = await getTodoById(id, userId);

    if (!todo) {
      console.error("Todo not found.");
      process.exit(1);
    }

    console.log(`Title:       ${todo.title}`);
    console.log(`ID:          ${todo.id}`);
    console.log(`Goal ID:     ${todo.goalId}`);
    console.log(`Milestone:   ${todo.milestoneId || "—"}`);
    console.log(`Description: ${todo.description || "—"}`);
    console.log(`Completed:   ${todo.completed ? "Yes" : "No"}`);
    console.log(`Due Date:    ${formatDate(todo.dueDate)}`);
    if (todo.completedAt) {
      console.log(`Completed At: ${formatDate(todo.completedAt)}`);
    }
  });

todosCommand
  .command("create")
  .description("Create a todo")
  .requiredOption("-g, --goal-id <goalId>", "Goal ID")
  .requiredOption("-t, --title <title>", "Title")
  .option("-d, --description <description>", "Description")
  .option("-m, --milestone-id <milestoneId>", "Milestone ID")
  .option("--due-date <date>", "Due date (YYYY-MM-DD)")
  .action(async function (this: Command) {
    const userId = getUserId(this);
    const opts = this.opts();
    const todo = await createTodo(
      {
        goalId: opts.goalId,
        title: opts.title,
        description: opts.description ?? null,
        milestoneId: opts.milestoneId ?? null,
        dueDate: opts.dueDate ? new Date(opts.dueDate) : null,
      },
      userId
    );

    if (!todo) {
      console.error(
        "Failed to create todo. Check that the goal and milestone exist."
      );
      process.exit(1);
    }

    console.log(`Created todo: ${todo.id}`);
    console.log(`Title: ${todo.title}`);
  });

todosCommand
  .command("complete <id>")
  .description("Mark a todo as complete")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const todo = await updateTodo(id, userId, { completed: true });
    if (!todo) {
      console.error("Todo not found.");
      process.exit(1);
    }
    console.log(`Completed: ${todo.title}`);
  });

todosCommand
  .command("update <id>")
  .description("Update a todo")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <description>", "New description")
  .option("--due-date <date>", "New due date (YYYY-MM-DD)")
  .option("--completed <bool>", "Set completed (true/false)")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const opts = this.opts();
    const data: Record<string, unknown> = {};
    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.dueDate) data.dueDate = new Date(opts.dueDate);
    if (opts.completed !== undefined)
      data.completed = opts.completed === "true";

    if (Object.keys(data).length === 0) {
      console.error("No fields to update.");
      process.exit(1);
    }

    const todo = await updateTodo(id, userId, data);
    if (!todo) {
      console.error("Todo not found.");
      process.exit(1);
    }

    console.log(`Updated todo: ${todo.id}`);
    console.log(`Title: ${todo.title}`);
  });

todosCommand
  .command("delete <id>")
  .description("Delete a todo")
  .action(async function (this: Command, id: string) {
    const userId = getUserId(this);
    const deleted = await deleteTodo(id, userId);
    if (!deleted) {
      console.error("Todo not found.");
      process.exit(1);
    }
    console.log("Todo deleted.");
  });
