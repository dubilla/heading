import { z } from "zod";

// App-created tokens must expire; "never" is intentionally not offered. Shared
// with the Settings UI so the select and the server validation can't drift.
export const TOKEN_EXPIRY_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
] as const;

const allowedDays: number[] = TOKEN_EXPIRY_OPTIONS.map((o) => o.days);

export const createTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  expiresInDays: z
    .number()
    .int()
    .refine((n) => allowedDays.includes(n), "Invalid expiry window"),
});

export type CreateTokenInput = z.infer<typeof createTokenSchema>;
