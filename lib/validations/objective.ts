import { z } from "zod";

export const createObjectiveSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
});

export const updateObjectiveSchema = z.object({
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
  status: z
    .enum(["not_started", "in_progress", "on_track", "off_track", "completed"])
    .optional(),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
