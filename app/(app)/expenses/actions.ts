"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense
} from "@/lib/data/expenses";

export type ExpenseFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const expenseFormSchema = z.object({
  expenseId: z.string().uuid().optional(),
  apartment_id: z.string().uuid(),
  amount: z.coerce.number().nonnegative("Amount cannot be negative."),
  category: z.enum([
    "cleaning",
    "repair",
    "supplies",
    "utilities",
    "commission",
    "marketing",
    "other"
  ]),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expense date is required."),
  note: z.string().optional(),
  returnTo: z.string().optional()
});

function getSafeReturnPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/expenses";
  }

  return value;
}

function revalidateExpenseRoutes(apartmentId?: string, expenseId?: string) {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/apartments");

  if (apartmentId) {
    revalidatePath(`/apartments/${apartmentId}`);
  }

  if (expenseId) {
    revalidatePath(`/expenses/${expenseId}/edit`);
  }
}

export async function saveExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const parsed = expenseFormSchema.safeParse({
    expenseId: formData.get("expenseId") || undefined,
    apartment_id: formData.get("apartment_id"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    expense_date: formData.get("expense_date"),
    note: formData.get("note"),
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    return {
      error: "Review the expense details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const expense = parsed.data.expenseId
      ? await updateExpense(parsed.data.expenseId, parsed.data)
      : await createExpense(parsed.data);

    revalidateExpenseRoutes(expense.apartment_id, expense.id);
    redirect(getSafeReturnPath(parsed.data.returnTo));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the expense right now."
    };
  }
}

export async function deleteExpenseAction(formData: FormData) {
  const expenseId = String(formData.get("expenseId") || "");
  const returnTo = getSafeReturnPath(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null
  );

  const existing = await getExpenseById(expenseId);

  if (!existing) {
    redirect(returnTo);
  }

  await deleteExpense(expenseId);
  revalidateExpenseRoutes(existing.apartment_id, expenseId);
  redirect(returnTo);
}
