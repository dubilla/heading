import { z } from "zod";

export const createGoalSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  targetDate: z.coerce.date({ message: "Valid target date is required" }),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional()
    .nullable(),
  objectiveId: z.string().uuid("Invalid objective ID").optional().nullable(),
});

export const updateGoalSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  targetDate: z.coerce.date({ message: "Invalid date format" }).optional(),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional()
    .nullable(),
  objectiveId: z.string().uuid("Invalid objective ID").optional().nullable(),
  status: z
    .enum(["not_started", "in_progress", "on_track", "off_track", "completed"])
    .optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
