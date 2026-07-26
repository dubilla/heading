#!/usr/bin/env node
import "tsconfig-paths/register";
import { Command } from "commander";
import { objectivesCommand } from "./commands/objectives";
import { goalsCommand } from "./commands/goals";
import { milestonesCommand } from "./commands/milestones";
import { todosCommand } from "./commands/todos";
import { dashboardCommand } from "./commands/dashboard";
import { loginCommand, logoutCommand } from "./commands/auth";

const program = new Command();

program
  .name("heading")
  .description("CLI for managing goals and objectives in Heading")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(objectivesCommand);
program.addCommand(goalsCommand);
program.addCommand(milestonesCommand);
program.addCommand(todosCommand);
program.addCommand(dashboardCommand);

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
