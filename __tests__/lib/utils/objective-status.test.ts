import { deriveObjectiveStatus } from "@/lib/utils/objective-status";

describe("deriveObjectiveStatus", () => {
  it("is not started with no goals", () => {
    expect(deriveObjectiveStatus([])).toBe("not_started");
  });

  it("is not started when every goal is untouched", () => {
    expect(deriveObjectiveStatus(["not_started", "not_started"])).toBe(
      "not_started"
    );
  });

  it("is completed only when every goal is completed", () => {
    expect(deriveObjectiveStatus(["completed", "completed"])).toBe("completed");
    expect(deriveObjectiveStatus(["completed", "in_progress"])).toBe(
      "in_progress"
    );
  });

  it("flags off track when any goal is off track", () => {
    expect(deriveObjectiveStatus(["on_track", "off_track", "completed"])).toBe(
      "off_track"
    );
  });

  it("is on track when some goal is on track and none off track", () => {
    expect(deriveObjectiveStatus(["on_track", "not_started"])).toBe("on_track");
  });

  it("is in progress for any other activity", () => {
    expect(deriveObjectiveStatus(["in_progress", "not_started"])).toBe(
      "in_progress"
    );
    expect(deriveObjectiveStatus(["completed", "not_started"])).toBe(
      "in_progress"
    );
  });
});
