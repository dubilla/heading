import { Command } from "commander";
import { getObjectiveStats } from "@/lib/db/objectives";
import { getGoalStats } from "@/lib/db/goals";
import { getTodoStats } from "@/lib/db/todos";
import { getUserId } from "../utils";

export const dashboardCommand = new Command("dashboard")
  .alias("dash")
  .description("Show overview stats")
  .action(async function (this: Command) {
    const userId = getUserId(this);

    const [objStats, goalStats, todoStats] = await Promise.all([
      getObjectiveStats(userId),
      getGoalStats(userId),
      getTodoStats(userId),
    ]);

    console.log("=== Heading Dashboard ===\n");

    console.log("Objectives:");
    console.log(`  Total: ${objStats.total}  In Progress: ${objStats.inProgress}  Completed: ${objStats.completed}  Off Track: ${objStats.offTrack}`);

    console.log("\nGoals:");
    console.log(`  Total: ${goalStats.total}  In Progress: ${goalStats.inProgress}  Completed: ${goalStats.completed}  Off Track: ${goalStats.offTrack}`);

    console.log("\nTodos:");
    console.log(`  Total: ${todoStats.total}  Completed: ${todoStats.completed}  Pending: ${todoStats.pending}`);
    console.log(`  Due This Week: ${todoStats.dueThisWeek}  Overdue: ${todoStats.overdue}`);
  });
