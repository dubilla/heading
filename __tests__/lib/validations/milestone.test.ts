import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from "@/lib/validations/milestone";

describe("createMilestoneSchema", () => {
  const validGoalId = "123e4567-e89b-12d3-a456-426614174000";

  it("validates correct milestone data", () => {
    const validData = {
      goalId: validGoalId,
      title: "Complete training plan",
      description: "Finish the 12-week training program",
      dueDate: "2025-03-31",
      type: "quarterly",
      quarter: 1,
    };

    const result = createMilestoneSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates milestone with only required fields", () => {
    const validData = {
      goalId: validGoalId,
      title: "Complete training",
      dueDate: "2025-03-31",
      type: "quarterly",
    };

    const result = createMilestoneSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid goal ID", () => {
    const invalidData = {
      goalId: "invalid-uuid",
      title: "Test",
      dueDate: "2025-03-31",
      type: "quarterly",
    };

    const result = createMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "",
      dueDate: "2025-03-31",
      type: "quarterly",
    };

    const result = createMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "Test",
      dueDate: "2025-03-31",
      type: "invalid",
    };

    const result = createMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid quarter values", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "Test",
      dueDate: "2025-03-31",
      type: "quarterly",
      quarter: 5,
    };

    const result = createMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid month values", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "Test",
      dueDate: "2025-03-31",
      type: "monthly",
      month: 13,
    };

    const result = createMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts valid quarter and month values", () => {
    for (let q = 1; q <= 4; q++) {
      const result = createMilestoneSchema.safeParse({
        goalId: validGoalId,
        title: "Test",
        dueDate: "2025-03-31",
        type: "quarterly",
        quarter: q,
      });
      expect(result.success).toBe(true);
    }

    for (let m = 1; m <= 12; m++) {
      const result = createMilestoneSchema.safeParse({
        goalId: validGoalId,
        title: "Test",
        dueDate: "2025-03-31",
        type: "monthly",
        month: m,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateMilestoneSchema", () => {
  it("validates partial update", () => {
    const validData = {
      title: "Updated Title",
    };

    const result = updateMilestoneSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates status update", () => {
    const validData = {
      status: "completed",
    };

    const result = updateMilestoneSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const invalidData = {
      status: "invalid_status",
    };

    const result = updateMilestoneSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates all valid statuses", () => {
    const statuses = ["not_started", "in_progress", "completed", "off_track"];

    statuses.forEach((status) => {
      const result = updateMilestoneSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it("validates empty update object", () => {
    const result = updateMilestoneSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
