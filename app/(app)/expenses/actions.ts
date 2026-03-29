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
import { resolveLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import {
  createExpenseSchema,
  type ExpenseInput,
  type ExpenseUpdateInput
} from "@/lib/validations/expense";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export type ExpenseFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const expenseMetaSchema = z.object({
  expenseId: z.string().uuid().optional(),
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
  const locale = resolveLocale(formData.get("locale"));
  const messages = getMessages(locale);
  const metaParsed = expenseMetaSchema.safeParse({
    expenseId: formData.get("expenseId") || undefined,
    returnTo: formData.get("returnTo") || undefined
  });
  const parsed = createExpenseSchema(locale).safeParse({
    apartment_id: formData.get("apartment_id"),
    amount_original: formData.get("amount_original"),
    currency: formData.get("currency"),
    category: formData.get("category"),
    expense_date: formData.get("expense_date"),
    note: formData.get("note")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "Xarajat ma'lumotlarini tekshirib, yana urinib ko'ring."
          : "Проверьте данные расхода и попробуйте снова.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (!metaParsed.success) {
    return {
      error: messages.forms.saveError
    };
  }

  try {
    const expensePayload: ExpenseInput = {
      apartment_id: parsed.data.apartment_id,
      amount_original: parsed.data.amount_original,
      currency: parsed.data.currency,
      category: parsed.data.category,
      expense_date: parsed.data.expense_date,
      note: parsed.data.note?.trim() ? parsed.data.note.trim() : null
    };

    let expense: ExpenseRow;

    if (metaParsed.data.expenseId) {
      expense = await updateExpense(
        metaParsed.data.expenseId,
        expensePayload as ExpenseUpdateInput
      );
    } else {
      expense = await createExpense(expensePayload);
    }

    revalidateExpenseRoutes(expense.apartment_id, expense.id);
    redirect(getSafeReturnPath(metaParsed.data.returnTo));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Xarajatni hozircha saqlab bo'lmadi."
            : "Сейчас не удалось сохранить расход."
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
