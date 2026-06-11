import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    checkInDay: z
      .number()
      .int()
      .min(0, "Check-in day must be between 0 (Sunday) and 6 (Saturday)")
      .max(6, "Check-in day must be between 0 (Sunday) and 6 (Saturday)")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.checkInDay !== undefined, {
    message: "Nothing to update",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "New password must be 100 characters or less"),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
