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

export const updateMilestoneSchema = z
  .object({
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
    type: z
      .enum(["quarterly", "monthly"], {
        message: "Type must be quarterly or monthly",
      })
      .optional(),
    status: z
      .enum(["not_started", "in_progress", "completed", "off_track"])
      .optional(),
    quarter: z.number().int().min(1).max(4).optional().nullable(),
    month: z.number().int().min(1).max(12).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Only enforceable when the caller sends type in the same payload; partial
    // updates that omit type are taken at face value against the stored row.
    if (data.type === "monthly" && data.month == null) {
      ctx.addIssue({
        code: "custom",
        message: "Monthly milestones need a month",
        path: ["month"],
      });
    }
    if (data.type === "quarterly" && data.month != null) {
      ctx.addIssue({
        code: "custom",
        message: "Quarterly milestones cannot have a month",
        path: ["month"],
      });
    }
  });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
