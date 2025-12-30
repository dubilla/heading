import { z } from "zod";

export const createCheckInSchema = z.object({
  weekStartDate: z.coerce.date({
    message: "Valid week start date is required",
  }),
  accomplishments: z
    .string()
    .min(1, "Accomplishments are required")
    .max(5000, "Accomplishments must be 5000 characters or less"),
  challenges: z
    .string()
    .min(1, "Challenges are required")
    .max(5000, "Challenges must be 5000 characters or less"),
  nextWeekPriorities: z
    .string()
    .min(1, "Next week priorities are required")
    .max(5000, "Priorities must be 5000 characters or less"),
  needsAdjustment: z.boolean(),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
