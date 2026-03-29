import { z } from "zod";

import type { AppLocale } from "@/lib/types/domain";

export function createLoginSchema(locale: AppLocale = "ru") {
  return z.object({
    email: z
      .string()
      .trim()
      .email(
        locale === "uz"
          ? "To'g'ri email manzilini kiriting."
          : "Укажите корректный email."
      ),
    password: z
      .string()
      .min(
        8,
        locale === "uz"
          ? "Parol kamida 8 belgidan iborat bo'lishi kerak."
          : "Пароль должен быть не короче 8 символов."
      )
  });
}

export const loginSchema = createLoginSchema();

export type LoginInput = z.infer<typeof loginSchema>;
