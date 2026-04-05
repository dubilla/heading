import { formatDate, formatStatus, printTable } from "@/cli/utils";

describe("formatDate", () => {
  it("formats a Date object to YYYY-MM-DD", () => {
    const date = new Date("2026-03-15T00:00:00Z");
    expect(formatDate(date)).toBe("2026-03-15");
  });

  it("formats a date string to YYYY-MM-DD", () => {
    expect(formatDate("2026-12-01T10:30:00Z")).toBe("2026-12-01");
  });

  it("returns dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatStatus", () => {
  it("converts not_started to title case", () => {
    expect(formatStatus("not_started")).toBe("Not Started");
  });

  it("converts in_progress to title case", () => {
    expect(formatStatus("in_progress")).toBe("In Progress");
  });

  it("converts on_track to title case", () => {
    expect(formatStatus("on_track")).toBe("On Track");
  });

  it("converts off_track to title case", () => {
    expect(formatStatus("off_track")).toBe("Off Track");
  });

  it("converts completed to title case", () => {
    expect(formatStatus("completed")).toBe("Completed");
  });

  it("handles single word status", () => {
    expect(formatStatus("active")).toBe("Active");
  });
});

describe("printTable", () => {
  it("prints formatted table to stdout", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    printTable(
      ["ID", "Title"],
      [
        ["abc", "My Goal"],
        ["def", "Another Goal"],
      ]
    );

    expect(spy).toHaveBeenCalledTimes(4); // header + separator + 2 rows
    const calls = spy.mock.calls.map((c) => c[0]);

    // Header row should contain both headers
    expect(calls[0]).toContain("ID");
    expect(calls[0]).toContain("Title");

    // Separator
    expect(calls[1]).toContain("─");

    // Data rows
    expect(calls[2]).toContain("My Goal");

    spy.mockRestore();
  });

  it("pads columns to equal width", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    printTable(
      ["Name"],
      [["Short"], ["A Much Longer Name"]]
    );

    const calls = spy.mock.calls.map((c) => c[0]);
    // Both data rows should have same length (padded)
    expect(calls[2].length).toBe(calls[3].length);

    spy.mockRestore();
  });

  it("handles empty rows", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    printTable(["Col1"], []);

    // Header + separator only
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockRestore();
  });
});
