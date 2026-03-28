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
import type { Database } from "@/lib/supabase/database.types";
import type { ExpenseInput, ExpenseUpdateInput } from "@/lib/validations/expense";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

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
    const expensePayload: ExpenseInput = {
      apartment_id: parsed.data.apartment_id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      expense_date: parsed.data.expense_date,
      note: parsed.data.note?.trim() ? parsed.data.note.trim() : null
    };

    let expense: ExpenseRow;

    if (parsed.data.expenseId) {
      expense = await updateExpense(
        parsed.data.expenseId,
        expensePayload as ExpenseUpdateInput
      );
    } else {
      expense = await createExpense(expensePayload);
    }

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

  const existingResult = await getExpenseById(expenseId);

  if (!existingResult) {
    redirect(returnTo);
  }

  const existing: ExpenseRow = existingResult;

  await deleteExpense(expenseId);
  revalidateExpenseRoutes(existing.apartment_id, expenseId);
  redirect(returnTo);
}
