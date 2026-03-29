import { z } from "zod";

import type { AppLocale } from "@/lib/types/domain";

export function createSettingsSchema(locale: AppLocale = "ru") {
  return z.object({
    business_name: z
      .string()
      .trim()
      .min(
        2,
        locale === "uz"
          ? "Biznes nomini kiriting."
          : "Укажите название бизнеса."
      )
      .max(
        120,
        locale === "uz"
          ? "Biznes nomi 120 belgidan oshmasligi kerak."
          : "Название бизнеса не должно быть длиннее 120 символов."
      ),
    currency: z.enum(["USD", "UZS"]).default("USD"),
    timezone: z
      .string()
      .trim()
      .min(
        2,
        locale === "uz"
          ? "Vaqt zonasini kiriting."
          : "Укажите часовой пояс."
      )
      .max(
        80,
        locale === "uz"
          ? "Vaqt zonasi qiymati juda uzun."
          : "Значение часового пояса слишком длинное."
      )
  });
}

export const settingsSchema = createSettingsSchema();

export type SettingsInput = z.infer<typeof settingsSchema>;
