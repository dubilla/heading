import {
  updateSettingsSchema,
  changePasswordSchema,
} from "@/lib/validations/settings";

describe("updateSettingsSchema", () => {
  it("accepts a name update", () => {
    expect(updateSettingsSchema.safeParse({ name: "Dan" }).success).toBe(true);
  });

  it("accepts a check-in day update", () => {
    expect(updateSettingsSchema.safeParse({ checkInDay: 6 }).success).toBe(
      true
    );
  });

  it("rejects an empty payload", () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(updateSettingsSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects out-of-range check-in days", () => {
    expect(updateSettingsSchema.safeParse({ checkInDay: 7 }).success).toBe(
      false
    );
    expect(updateSettingsSchema.safeParse({ checkInDay: -1 }).success).toBe(
      false
    );
    expect(updateSettingsSchema.safeParse({ checkInDay: 2.5 }).success).toBe(
      false
    );
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(true);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});
