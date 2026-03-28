import { z } from "zod";

export const userRoleSchema = z.enum(["owner", "member"]);

export const userProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must be 120 characters or less."),
  email: z.string().trim().email("Enter a valid email address."),
  role: userRoleSchema
});

export const userProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must be 120 characters or less.")
    .optional(),
  role: userRoleSchema.optional()
});

export const userInviteSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must be 120 characters or less."),
  email: z.string().trim().email("Enter a valid email address."),
  role: userRoleSchema
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type UserInviteInput = z.infer<typeof userInviteSchema>;
