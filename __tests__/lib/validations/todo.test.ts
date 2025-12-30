import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo";

describe("createTodoSchema", () => {
  const validGoalId = "123e4567-e89b-12d3-a456-426614174000";
  const validMilestoneId = "223e4567-e89b-12d3-a456-426614174000";

  it("validates correct todo data", () => {
    const validData = {
      goalId: validGoalId,
      milestoneId: validMilestoneId,
      title: "Complete task",
      description: "Finish this important task",
      dueDate: "2025-03-31",
    };

    const result = createTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates todo with only required fields", () => {
    const validData = {
      goalId: validGoalId,
      title: "Complete task",
    };

    const result = createTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates todo without milestone", () => {
    const validData = {
      goalId: validGoalId,
      title: "Complete task",
      milestoneId: null,
    };

    const result = createTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid goal ID", () => {
    const invalidData = {
      goalId: "invalid-uuid",
      title: "Test",
    };

    const result = createTodoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid milestone ID", () => {
    const invalidData = {
      goalId: validGoalId,
      milestoneId: "invalid-uuid",
      title: "Test",
    };

    const result = createTodoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "",
    };

    const result = createTodoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "a".repeat(201),
    };

    const result = createTodoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const invalidData = {
      goalId: validGoalId,
      title: "Valid Title",
      description: "a".repeat(1001),
    };

    const result = createTodoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("updateTodoSchema", () => {
  it("validates partial update", () => {
    const validData = {
      title: "Updated Title",
    };

    const result = updateTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates completed update", () => {
    const validData = {
      completed: true,
    };

    const result = updateTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates empty update object", () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates due date update", () => {
    const validData = {
      dueDate: "2025-06-15",
    };

    const result = updateTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates null due date", () => {
    const validData = {
      dueDate: null,
    };

    const result = updateTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
