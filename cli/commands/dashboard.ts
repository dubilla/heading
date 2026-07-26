import { Command } from "commander";
import { apiGet } from "../api";

type DashboardStats = {
  objectives: {
    total: number;
    inProgress: number;
    completed: number;
    offTrack: number;
  };
  goals: {
    total: number;
    inProgress: number;
    completed: number;
    offTrack: number;
  };
  todos: {
    total: number;
    completed: number;
    pending: number;
    dueThisWeek: number;
    overdue: number;
  };
};

export const dashboardCommand = new Command("dashboard")
  .alias("dash")
  .description("Show overview stats")
  .action(async () => {
    const { objectives, goals, todos } =
      await apiGet<DashboardStats>("/api/dashboard");

    console.log("=== Heading Dashboard ===\n");

    console.log("Objectives:");
    console.log(
      `  Total: ${objectives.total}  In Progress: ${objectives.inProgress}  Completed: ${objectives.completed}  Off Track: ${objectives.offTrack}`
    );

    console.log("\nGoals:");
    console.log(
      `  Total: ${goals.total}  In Progress: ${goals.inProgress}  Completed: ${goals.completed}  Off Track: ${goals.offTrack}`
    );

    console.log("\nTodos:");
    console.log(
      `  Total: ${todos.total}  Completed: ${todos.completed}  Pending: ${todos.pending}`
    );
    console.log(
      `  Due This Week: ${todos.dueThisWeek}  Overdue: ${todos.overdue}`
    );
  });
