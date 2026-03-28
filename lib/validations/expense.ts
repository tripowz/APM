import { z } from "zod";

export const expenseCategorySchema = z.enum([
  "cleaning",
  "repair",
  "supplies",
  "utilities",
  "commission",
  "marketing",
  "other"
]);

export const expenseSchema = z.object({
  apartment_id: z.string().uuid("Choose a valid apartment."),
  amount: z.coerce.number().nonnegative("Amount cannot be negative."),
  category: expenseCategorySchema,
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expense date is required."),
  note: z
    .string()
    .trim()
    .max(1000, "Note must be 1000 characters or less.")
    .nullish()
    .transform((value) => value || null)
});

export const expenseUpdateSchema = expenseSchema.partial();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
