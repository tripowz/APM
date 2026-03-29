import { z } from "zod";

import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

export const paymentStatusSchema = z.enum(["unpaid", "partial", "paid"]);
export const bookingCurrencySchema = z.enum(["USD", "UZS"]);
export const bookingStatusSchema = z.enum([
  "new",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled"
]);

export function createBookingBaseSchema(locale: AppLocale = "ru") {
  const messages = getMessages(locale);

  return z.object({
    apartment_id: z.string().uuid(messages.validations.apartmentRequired),
    guest_name: z
      .string()
      .trim()
      .min(2, messages.validations.guestNameRequired)
      .max(
        120,
        locale === "uz"
          ? "Mehmon ismi 120 belgidan oshmasligi kerak."
          : "Имя гостя не должно быть длиннее 120 символов."
      ),
    guest_phone: z
      .string()
      .trim()
      .max(
        30,
        locale === "uz"
          ? "Telefon 30 belgidan oshmasligi kerak."
          : "Телефон не должен быть длиннее 30 символов."
      )
      .nullish()
      .transform((value) => value || null),
    check_in: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, messages.validations.checkInRequired),
    check_out: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, messages.validations.checkOutRequired),
    currency: bookingCurrencySchema.default("USD"),
    total_amount_original: z.coerce
      .number()
      .nonnegative(messages.validations.amountNegative),
    prepaid_amount: z.coerce
      .number()
      .nonnegative(messages.validations.amountNegative)
      .default(0),
    payment_status: paymentStatusSchema.default("unpaid"),
    booking_status: bookingStatusSchema.default("new"),
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

function withBookingRules<TSchema extends ReturnType<typeof createBookingBaseSchema>>(
  schema: TSchema,
  locale: AppLocale = "ru"
) {
  const messages = getMessages(locale);

  return schema
    .refine((value) => value.check_out > value.check_in, {
      message: messages.validations.checkoutAfterCheckin,
      path: ["check_out"]
    })
    .refine((value) => value.prepaid_amount <= value.total_amount_original, {
      message: messages.validations.prepaidExceedsTotal,
      path: ["prepaid_amount"]
    });
}

export function createBookingSchema(locale: AppLocale = "ru") {
  return withBookingRules(createBookingBaseSchema(locale), locale);
}

export const bookingSchema = createBookingSchema();
export const bookingUpdateSchema = createBookingBaseSchema().partial();

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
