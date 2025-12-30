import {
  calculateProgress,
  calculateExpectedProgress,
  determineStatus,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils/progress";

describe("calculateProgress", () => {
  it("returns 0 for no todos", () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it("returns 0 for no completed todos", () => {
    expect(calculateProgress(10, 0)).toBe(0);
  });

  it("returns 100 for all completed todos", () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it("returns correct percentage for partial completion", () => {
    expect(calculateProgress(10, 5)).toBe(50);
    expect(calculateProgress(4, 1)).toBe(25);
    expect(calculateProgress(3, 1)).toBe(33);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProgress(3, 1)).toBe(33);
    expect(calculateProgress(3, 2)).toBe(67);
  });
});

describe("calculateExpectedProgress", () => {
  it("returns 0 if current date is before start date", () => {
    const start = new Date("2025-06-01");
    const target = new Date("2025-12-31");
    const current = new Date("2025-01-01");
    expect(calculateExpectedProgress(start, target, current)).toBe(0);
  });

  it("returns 100 if current date is after target date", () => {
    const start = new Date("2025-01-01");
    const target = new Date("2025-06-30");
    const current = new Date("2025-12-31");
    expect(calculateExpectedProgress(start, target, current)).toBe(100);
  });

  it("returns correct percentage for midpoint", () => {
    const start = new Date("2025-01-01");
    const target = new Date("2025-12-31");
    const current = new Date("2025-07-01"); // roughly midpoint
    const expected = calculateExpectedProgress(start, target, current);
    expect(expected).toBeGreaterThan(45);
    expect(expected).toBeLessThan(55);
  });

  it("returns 100 on exact target date", () => {
    const start = new Date("2025-01-01");
    const target = new Date("2025-12-31");
    expect(calculateExpectedProgress(start, target, target)).toBe(100);
  });
});

describe("determineStatus", () => {
  it("returns not_started for 0 todos", () => {
    expect(determineStatus(0, 50, 0)).toBe("not_started");
  });

  it("returns not_started for 0% actual progress", () => {
    expect(determineStatus(0, 50, 10)).toBe("not_started");
  });

  it("returns completed for 100% actual progress", () => {
    expect(determineStatus(100, 50, 10)).toBe("completed");
  });

  it("returns on_track when actual >= expected - 10", () => {
    expect(determineStatus(50, 55, 10)).toBe("on_track");
    expect(determineStatus(45, 55, 10)).toBe("on_track");
    expect(determineStatus(60, 55, 10)).toBe("on_track");
  });

  it("returns at_risk when actual between expected-25 and expected-10", () => {
    expect(determineStatus(35, 55, 10)).toBe("at_risk");
    expect(determineStatus(30, 55, 10)).toBe("at_risk");
  });

  it("returns off_track when actual < expected - 25", () => {
    expect(determineStatus(20, 55, 10)).toBe("off_track");
    expect(determineStatus(10, 55, 10)).toBe("off_track");
  });
});

describe("getStatusColor", () => {
  it("returns correct colors for each status", () => {
    expect(getStatusColor("completed")).toBe("bg-purple-500");
    expect(getStatusColor("on_track")).toBe("bg-green-500");
    expect(getStatusColor("at_risk")).toBe("bg-yellow-500");
    expect(getStatusColor("off_track")).toBe("bg-red-500");
    expect(getStatusColor("in_progress")).toBe("bg-blue-500");
    expect(getStatusColor("not_started")).toBe("bg-gray-300");
  });
});

describe("getStatusLabel", () => {
  it("returns correct labels for each status", () => {
    expect(getStatusLabel("completed")).toBe("Completed");
    expect(getStatusLabel("on_track")).toBe("On Track");
    expect(getStatusLabel("at_risk")).toBe("At Risk");
    expect(getStatusLabel("off_track")).toBe("Off Track");
    expect(getStatusLabel("in_progress")).toBe("In Progress");
    expect(getStatusLabel("not_started")).toBe("Not Started");
  });
});
