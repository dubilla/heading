import { readConfigFile, writeConfigFile, resolveConfig } from "@/cli/config";
import * as fs from "fs";

jest.mock("fs");
const mockFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.HEADING_API_URL;
  delete process.env.HEADING_TOKEN;
});

describe("readConfigFile", () => {
  it("returns an empty object when the file is missing", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(readConfigFile()).toEqual({});
  });

  it("parses the stored config", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ apiUrl: "u", token: "t" })
    );
    expect(readConfigFile()).toEqual({ apiUrl: "u", token: "t" });
  });

  it("returns an empty object on malformed json", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("not json");
    expect(readConfigFile()).toEqual({});
  });
});

describe("resolveConfig", () => {
  it("prefers env vars over the stored file", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ apiUrl: "file-url", token: "file-token" })
    );
    process.env.HEADING_API_URL = "env-url";
    process.env.HEADING_TOKEN = "env-token";
    expect(resolveConfig()).toEqual({ apiUrl: "env-url", token: "env-token" });
  });

  it("falls back to the file when env is unset", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ apiUrl: "file-url", token: "file-token" })
    );
    expect(resolveConfig()).toEqual({
      apiUrl: "file-url",
      token: "file-token",
    });
  });
});

describe("writeConfigFile", () => {
  it("creates the config dir and writes the file with 0600 perms", () => {
    writeConfigFile({ apiUrl: "u", token: "t" });
    expect(mockFs.mkdirSync).toHaveBeenCalled();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("config.json"),
      expect.stringContaining('"apiUrl"'),
      expect.objectContaining({ mode: 0o600 })
    );
    expect(mockFs.chmodSync).toHaveBeenCalledWith(
      expect.stringContaining("config.json"),
      0o600
    );
  });
});
