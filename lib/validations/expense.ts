import { z } from "zod";

import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

export const expenseCategorySchema = z.enum([
  "cleaning",
  "repair",
  "supplies",
  "utilities",
  "commission",
  "marketing",
  "other"
]);

export const expenseCurrencySchema = z.enum(["USD", "UZS"]);

export function createExpenseSchema(locale: AppLocale = "ru") {
  const messages = getMessages(locale);

  return z.object({
    apartment_id: z.string().uuid(messages.validations.apartmentRequired),
    amount_original: z.coerce
      .number()
      .nonnegative(messages.validations.amountNegative),
    currency: expenseCurrencySchema.default("USD"),
    category: expenseCategorySchema,
    expense_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, messages.validations.expenseDateRequired),
    note: z
      .string()
      .trim()
      .max(
        1000,
        locale === "uz"
          ? "Izoh 1000 belgidan oshmasligi kerak."
          : "Комментарий не должен быть длиннее 1000 символов."
      )
      .nullish()
      .transform((value) => value || null)
  });
}

export const expenseSchema = createExpenseSchema();
export const expenseUpdateSchema = expenseSchema.partial();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
