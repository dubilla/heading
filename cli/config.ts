import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".heading");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export const CONFIG_PATH_DISPLAY = CONFIG_PATH;

export type CliConfig = { apiUrl?: string; token?: string };

export function readConfigFile(): CliConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

export function writeConfigFile(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
  chmodSync(CONFIG_PATH, 0o600);
}

export function clearConfigFile(): void {
  if (existsSync(CONFIG_PATH)) rmSync(CONFIG_PATH);
}

// Env wins over the stored file so CI and one-off runs need no login.
export function resolveConfig(): CliConfig {
  const file = readConfigFile();
  return {
    apiUrl: process.env.HEADING_API_URL ?? file.apiUrl,
    token: process.env.HEADING_TOKEN ?? file.token,
  };
}
