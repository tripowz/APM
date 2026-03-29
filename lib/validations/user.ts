import { z } from "zod";

import type { AppLocale } from "@/lib/types/domain";

export const userRoleSchema = z.enum(["owner", "member"]);

export function createUserProfileSchema(locale: AppLocale = "ru") {
  return z.object({
    full_name: z
      .string()
      .trim()
      .min(
        2,
        locale === "uz"
          ? "Foydalanuvchi ismini kiriting."
          : "Укажите имя пользователя."
      )
      .max(
        120,
        locale === "uz"
          ? "Ism 120 belgidan oshmasligi kerak."
          : "Имя пользователя не должно быть длиннее 120 символов."
      ),
    email: z
      .string()
      .trim()
      .email(
        locale === "uz"
          ? "To'g'ri email manzilini kiriting."
          : "Укажите корректный email."
      ),
    role: userRoleSchema
  });
}

export function createUserProfileUpdateSchema(locale: AppLocale = "ru") {
  return z.object({
    full_name: z
      .string()
      .trim()
      .min(
        2,
        locale === "uz"
          ? "Foydalanuvchi ismini kiriting."
          : "Укажите имя пользователя."
      )
      .max(
        120,
        locale === "uz"
          ? "Ism 120 belgidan oshmasligi kerak."
          : "Имя пользователя не должно быть длиннее 120 символов."
      )
      .optional(),
    role: userRoleSchema.optional()
  });
}

export function createUserInviteSchema(locale: AppLocale = "ru") {
  return createUserProfileSchema(locale);
}

export const userProfileSchema = createUserProfileSchema();
export const userProfileUpdateSchema = createUserProfileUpdateSchema();
export const userInviteSchema = createUserInviteSchema();

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type UserInviteInput = z.infer<typeof userInviteSchema>;
