#!/usr/bin/env node
import "tsconfig-paths/register";
import { Command } from "commander";
import { objectivesCommand } from "./commands/objectives";
import { goalsCommand } from "./commands/goals";
import { milestonesCommand } from "./commands/milestones";
import { todosCommand } from "./commands/todos";
import { dashboardCommand } from "./commands/dashboard";

const program = new Command();

program
  .name("heading")
  .description("CLI for managing goals and objectives in Heading")
  .version("0.1.0")
  .option(
    "--user <userId>",
    "User ID (or set HEADING_USER_ID env var)",
    process.env.HEADING_USER_ID
  );

program.addCommand(objectivesCommand);
program.addCommand(goalsCommand);
program.addCommand(milestonesCommand);
program.addCommand(todosCommand);
program.addCommand(dashboardCommand);

program.parse();
