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

describe("password composition rules", () => {
  const base = { name: "Dan", email: "dan@example.com" };

  it("rejects passwords without a number", () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: "lettersonly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a letter", () => {
    const result = signUpSchema.safeParse({ ...base, password: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("accepts letter+number passwords", () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: "letters4nd numbers",
    });
    expect(result.success).toBe(true);
  });

  it("sign-in requires the same minimum length as accounts enforce", () => {
    const result = signInSchema.safeParse({
      email: "dan@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});
