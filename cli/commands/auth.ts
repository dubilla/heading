import { Command } from "commander";
import { createInterface } from "readline";
import { apiGet, ApiError } from "../api";
import {
  clearConfigFile,
  readConfigFile,
  writeConfigFile,
  CONFIG_PATH_DISPLAY,
} from "../config";

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

export const loginCommand = new Command("login")
  .description("Store API credentials for the CLI")
  .option("--url <url>", "Base URL of the Heading API")
  .option("--token <token>", "Personal access token")
  .action(async function (this: Command) {
    const opts = this.opts();
    const existing = readConfigFile();
    const enteredUrl =
      opts.url ??
      (await prompt(
        `API URL${existing.apiUrl ? ` [${existing.apiUrl}]` : ""}: `
      ));
    const url = enteredUrl || existing.apiUrl;
    const token = opts.token ?? (await prompt("Personal access token: "));

    if (!url || !token) {
      console.error("Both an API URL and a token are required.");
      process.exit(1);
    }

    writeConfigFile({ apiUrl: url.replace(/\/$/, ""), token });

    try {
      await apiGet("/api/objectives");
    } catch (error) {
      clearConfigFile();
      if (error instanceof ApiError) {
        console.error(`Could not authenticate: ${error.message}`);
        process.exit(1);
      }
      throw error;
    }

    console.log(`Logged in. Credentials saved to ${CONFIG_PATH_DISPLAY}.`);
  });

export const logoutCommand = new Command("logout")
  .description("Remove stored API credentials")
  .action(() => {
    clearConfigFile();
    console.log("Logged out.");
  });
