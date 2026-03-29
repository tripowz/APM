import { z } from "zod";

import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

export const apartmentStatusSchema = z.enum(["active", "inactive"]);

export function createApartmentSchema(locale: AppLocale = "ru") {
  const messages = getMessages(locale);

  return z.object({
    title: z
      .string()
      .trim()
      .min(
        2,
        locale === "uz"
          ? "Kvartira uchun tushunarli nom kiriting."
          : "Укажите понятное название квартиры."
      )
      .max(
        140,
        locale === "uz"
          ? "Kvartira nomi 140 belgidan oshmasligi kerak."
          : "Название квартиры не должно быть длиннее 140 символов."
      ),
    address: z
      .string()
      .trim()
      .min(
        5,
        locale === "uz"
          ? "Kvartira manzilini kiriting."
          : "Укажите адрес квартиры."
      )
      .max(
        240,
        locale === "uz"
          ? "Manzil 240 belgidan oshmasligi kerak."
          : "Адрес не должен быть длиннее 240 символов."
      ),
    base_price: z.coerce.number().nonnegative(messages.validations.amountNegative),
    status: apartmentStatusSchema.default("active"),
    notes: z
      .string()
      .trim()
      .max(
        2000,
        locale === "uz"
          ? "Izoh 2000 belgidan oshmasligi kerak."
          : "Комментарий не должен быть длиннее 2000 символов."
      )
      .nullish()
      .transform((value) => value || null)
  });
}

export const apartmentSchema = createApartmentSchema();
export const apartmentUpdateSchema = apartmentSchema.partial();

export type ApartmentInput = z.infer<typeof apartmentSchema>;
export type ApartmentUpdateInput = z.infer<typeof apartmentUpdateSchema>;
