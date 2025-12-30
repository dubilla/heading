import { z } from "zod";

export const createTodoSchema = z.object({
  goalId: z.string().uuid("Invalid goal ID"),
  milestoneId: z.string().uuid("Invalid milestone ID").optional().nullable(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  dueDate: z.coerce
    .date({ message: "Invalid date format" })
    .optional()
    .nullable(),
});

export const updateTodoSchema = z.object({
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
  dueDate: z.coerce
    .date({ message: "Invalid date format" })
    .optional()
    .nullable(),
  completed: z.boolean().optional(),
  milestoneId: z.string().uuid("Invalid milestone ID").optional().nullable(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
