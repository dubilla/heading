import {
  createObjectiveSchema,
  updateObjectiveSchema,
} from "@/lib/validations/objective";

describe("createObjectiveSchema", () => {
  it("validates correct objective data", () => {
    const validData = {
      title: "Become a better runner",
      description: "Improve my running performance and endurance",
    };

    const result = createObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates objective with only required fields", () => {
    const validData = {
      title: "Become a better runner",
    };

    const result = createObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const invalidData = {
      title: "",
    };

    const result = createObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const invalidData = {
      description: "Some description",
    };

    const result = createObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const invalidData = {
      title: "a".repeat(201),
    };

    const result = createObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const invalidData = {
      title: "Valid Title",
      description: "a".repeat(1001),
    };

    const result = createObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("accepts null description", () => {
    const validData = {
      title: "Valid Title",
      description: null,
    };

    const result = createObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts undefined description", () => {
    const validData = {
      title: "Valid Title",
      description: undefined,
    };

    const result = createObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("updateObjectiveSchema", () => {
  it("validates partial update with title only", () => {
    const validData = {
      title: "Updated Title",
    };

    const result = updateObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates partial update with description only", () => {
    const validData = {
      description: "Updated description",
    };

    const result = updateObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates status update", () => {
    const validData = {
      status: "in_progress",
    };

    const result = updateObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const invalidData = {
      status: "invalid_status",
    };

    const result = updateObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates empty update object", () => {
    const validData = {};

    const result = updateObjectiveSchema.safeParse(validData);
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
      const result = updateObjectiveSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it("validates full update with all fields", () => {
    const validData = {
      title: "Updated Title",
      description: "Updated description",
      status: "on_track",
    };

    const result = updateObjectiveSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty title when provided", () => {
    const invalidData = {
      title: "",
    };

    const result = updateObjectiveSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
