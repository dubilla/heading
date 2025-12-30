import { createGoalSchema, updateGoalSchema } from "@/lib/validations/goal";

describe("createGoalSchema", () => {
  it("validates correct goal data", () => {
    const validData = {
      title: "Run a marathon",
      description: "Complete my first full marathon",
      targetDate: "2025-12-31",
      category: "Health",
    };

    const result = createGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates goal with only required fields", () => {
    const validData = {
      title: "Run a marathon",
      targetDate: "2025-12-31",
    };

    const result = createGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const invalidData = {
      title: "",
      targetDate: "2025-12-31",
    };

    const result = createGoalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const invalidData = {
      title: "a".repeat(201),
      targetDate: "2025-12-31",
    };

    const result = createGoalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const invalidData = {
      title: "Valid Title",
      description: "a".repeat(1001),
      targetDate: "2025-12-31",
    };

    const result = createGoalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const invalidData = {
      title: "Valid Title",
      targetDate: "not-a-date",
    };

    const result = createGoalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts null description", () => {
    const validData = {
      title: "Valid Title",
      description: null,
      targetDate: "2025-12-31",
    };

    const result = createGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("updateGoalSchema", () => {
  it("validates partial update", () => {
    const validData = {
      title: "Updated Title",
    };

    const result = updateGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates status update", () => {
    const validData = {
      status: "in_progress",
    };

    const result = updateGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const invalidData = {
      status: "invalid_status",
    };

    const result = updateGoalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates empty update object", () => {
    const validData = {};

    const result = updateGoalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates all valid statuses", () => {
    const statuses = [
      "not_started",
      "in_progress",
      "on_track",
      "off_track",
      "completed",
    ];

    statuses.forEach((status) => {
      const result = updateGoalSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });
});
