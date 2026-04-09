import { z } from "zod";

const startTargetRefinement = (
  data: { startValue?: number; targetValue?: number },
  ctx: z.RefinementCtx
) => {
  if (
    data.startValue !== undefined &&
    data.targetValue !== undefined &&
    data.startValue === data.targetValue
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["targetValue"],
      message: "Target value must differ from start value",
    });
  }
};

export const createGoalSchema = z
  .object({
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
    startValue: z.coerce
      .number({ message: "Start value must be a number" })
      .finite("Start value must be finite")
      .default(0),
    targetValue: z.coerce
      .number({ message: "Target value must be a number" })
      .finite("Target value must be finite")
      .default(100),
    unit: z.string().max(20, "Unit must be 20 characters or less").default("%"),
  })
  .superRefine(startTargetRefinement);

export const updateGoalSchema = z
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
    targetDate: z.coerce.date({ message: "Invalid date format" }).optional(),
    category: z
      .string()
      .max(50, "Category must be 50 characters or less")
      .optional()
      .nullable(),
    objectiveId: z.string().uuid("Invalid objective ID").optional().nullable(),
    status: z
      .enum([
        "not_started",
        "in_progress",
        "on_track",
        "off_track",
        "completed",
      ])
      .optional(),
    startValue: z.coerce
      .number({ message: "Start value must be a number" })
      .finite("Start value must be finite")
      .optional(),
    targetValue: z.coerce
      .number({ message: "Target value must be a number" })
      .finite("Target value must be finite")
      .optional(),
    unit: z.string().max(20, "Unit must be 20 characters or less").optional(),
  })
  .superRefine(startTargetRefinement);

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
