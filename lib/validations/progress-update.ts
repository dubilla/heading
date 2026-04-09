import { z } from "zod";

export const createProgressUpdateSchema = z.object({
  value: z.coerce
    .number({ message: "Value must be a number" })
    .finite("Value must be finite"),
  note: z
    .string()
    .max(2000, "Note must be 2000 characters or less")
    .optional()
    .nullable(),
  occurredAt: z.coerce.date({ message: "Valid date is required" }).optional(),
});

export const updateProgressUpdateSchema = z.object({
  value: z.coerce
    .number({ message: "Value must be a number" })
    .finite("Value must be finite")
    .optional(),
  note: z
    .string()
    .max(2000, "Note must be 2000 characters or less")
    .optional()
    .nullable(),
  occurredAt: z.coerce.date({ message: "Valid date is required" }).optional(),
});

export type CreateProgressUpdateInput = z.infer<
  typeof createProgressUpdateSchema
>;
export type UpdateProgressUpdateInput = z.infer<
  typeof updateProgressUpdateSchema
>;
