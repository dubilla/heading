import { signUpSchema, signInSchema } from "@/lib/validations/auth";

describe("signUpSchema", () => {
  it("validates correct signup data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    const result = signUpSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const invalidData = {
      name: "",
      email: "john@example.com",
      password: "password123",
    };

    const result = signUpSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      password: "password123",
    };

    const result = signUpSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      password: "short",
    };

    const result = signUpSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("validates correct signin data", () => {
    const validData = {
      email: "john@example.com",
      password: "password123",
    };

    const result = signInSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const invalidData = {
      email: "invalid-email",
      password: "password123",
    };

    const result = signInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const invalidData = {
      email: "john@example.com",
      password: "",
    };

    const result = signInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
