import {
  createProgressUpdateSchema,
  updateProgressUpdateSchema,
} from "@/lib/validations/progress-update";

describe("createProgressUpdateSchema", () => {
  it("accepts numeric value only", () => {
    const result = createProgressUpdateSchema.safeParse({ value: 2 });
    expect(result.success).toBe(true);
  });

  it("accepts value + note + occurredAt", () => {
    const result = createProgressUpdateSchema.safeParse({
      value: 50,
      note: "Finished chapter 3",
      occurredAt: "2026-03-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts string value via coercion", () => {
    const result = createProgressUpdateSchema.safeParse({ value: "42.5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.value).toBe(42.5);
  });

  it("rejects missing value", () => {
    const result = createProgressUpdateSchema.safeParse({ note: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric value", () => {
    const result = createProgressUpdateSchema.safeParse({ value: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects NaN / infinite value", () => {
    expect(
      createProgressUpdateSchema.safeParse({ value: Number.POSITIVE_INFINITY })
        .success
    ).toBe(false);
    expect(
      createProgressUpdateSchema.safeParse({ value: Number.NaN }).success
    ).toBe(false);
  });

  it("rejects note exceeding 2000 characters", () => {
    const result = createProgressUpdateSchema.safeParse({
      value: 1,
      note: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid occurredAt", () => {
    const result = createProgressUpdateSchema.safeParse({
      value: 1,
      occurredAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProgressUpdateSchema", () => {
  it("accepts empty object", () => {
    expect(updateProgressUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial value update", () => {
    expect(updateProgressUpdateSchema.safeParse({ value: 10 }).success).toBe(
      true
    );
  });

  it("accepts nulling out the note", () => {
    expect(updateProgressUpdateSchema.safeParse({ note: null }).success).toBe(
      true
    );
  });

  it("rejects invalid value", () => {
    expect(
      updateProgressUpdateSchema.safeParse({ value: "nope" }).success
    ).toBe(false);
  });
});
