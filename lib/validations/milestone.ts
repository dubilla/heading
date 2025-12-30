import { z } from "zod";

export const createMilestoneSchema = z.object({
  goalId: z.string().uuid("Invalid goal ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  dueDate: z.coerce.date({ message: "Valid due date is required" }),
  type: z.enum(["quarterly", "monthly"], {
    message: "Type must be quarterly or monthly",
  }),
  quarter: z.number().int().min(1).max(4).optional().nullable(),
  month: z.number().int().min(1).max(12).optional().nullable(),
});

export const updateMilestoneSchema = z.object({
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
  dueDate: z.coerce.date({ message: "Invalid date format" }).optional(),
  status: z
    .enum(["not_started", "in_progress", "completed", "off_track"])
    .optional(),
  quarter: z.number().int().min(1).max(4).optional().nullable(),
  month: z.number().int().min(1).max(12).optional().nullable(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
