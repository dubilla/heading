import { createTokenSchema } from "@/lib/validations/token";

describe("createTokenSchema", () => {
  it("accepts a valid name and allowed expiry", () => {
    const result = createTokenSchema.safeParse({
      name: "laptop CLI",
      expiresInDays: 30,
    });
    expect(result.success).toBe(true);
  });

  it("trims the name", () => {
    const result = createTokenSchema.safeParse({
      name: "  laptop  ",
      expiresInDays: 7,
    });
    expect(result.success && result.data.name).toBe("laptop");
  });

  it("rejects an empty name", () => {
    const result = createTokenSchema.safeParse({ name: "", expiresInDays: 30 });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    const result = createTokenSchema.safeParse({
      name: "a".repeat(101),
      expiresInDays: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an expiry window that isn't on the allowed list", () => {
    const result = createTokenSchema.safeParse({
      name: "x",
      expiresInDays: 365,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer expiry", () => {
    const result = createTokenSchema.safeParse({
      name: "x",
      expiresInDays: 30.5,
    });
    expect(result.success).toBe(false);
  });
});
