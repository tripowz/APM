import "server-only";

import { normalizeToUsd } from "@/lib/currency";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  toMaybeTableRow,
  toSupabaseInsert,
  toSupabaseUpdate,
  toTableRow,
  toTableRows
} from "@/lib/supabase/tables";
import {
  expenseSchema,
  type ExpenseInput,
  type ExpenseUpdateInput
} from "@/lib/validations/expense";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

type ListExpenseFilters = {
  apartmentId?: string;
  from?: string;
  to?: string;
  category?:
    | "cleaning"
    | "repair"
    | "supplies"
    | "utilities"
    | "commission"
    | "marketing"
    | "other"
    | "all";
};

function isMissingExpenseMoneyColumnError(
  error: { message?: string; code?: string } | null
) {
  if (!error) {
    return false;
  }

  const message = error.message ?? "";

  return (
    error.code === "PGRST204" &&
    message.includes("expenses") &&
    (
      message.includes("'currency'") ||
      message.includes("'amount_original'") ||
      message.includes("'amount_usd'") ||
      message.includes("'exchange_rate_used'")
    )
  );
}

function toLegacyExpensePayload(input: ExpenseInput, amountUsd: number): ExpenseInsert {
  return {
    apartment_id: input.apartment_id,
    category: input.category,
    expense_date: input.expense_date,
    note: input.note,
    amount: amountUsd
  };
}

export async function listExpenses(
  filters: ListExpenseFilters | string = {}
): Promise<ExpenseRow[]> {
  const resolvedFilters =
    typeof filters === "string" ? { apartmentId: filters } : filters;
  const supabase = await createClient();
  let query = supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (resolvedFilters.apartmentId) {
    query = query.eq("apartment_id", resolvedFilters.apartmentId);
  }

  if (resolvedFilters.from) {
    query = query.gte("expense_date", resolvedFilters.from);
  }

  if (resolvedFilters.to) {
    query = query.lte("expense_date", resolvedFilters.to);
  }

  if (resolvedFilters.category && resolvedFilters.category !== "all") {
    query = query.eq("category", resolvedFilters.category);
  }

  const { data: expensesResult, error } = await query;

  if (error) {
    throw new Error(`Не удалось загрузить расходы: ${error.message}`);
  }

  return toTableRows<"expenses">(expensesResult);
}

export async function getExpenseById(id: string): Promise<ExpenseRow | null> {
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Не удалось загрузить расход: ${error.message}`);
  }

  return toMaybeTableRow<"expenses">(expenseResult);
}

async function resolveExchangeRateForCurrency(currency: ExpenseInput["currency"]) {
  if (currency === "USD") {
    return 1;
  }

  const latestRate = await getLatestUsdToUzsRate();

  if (!latestRate?.rate) {
    throw new Error(
      "Нет актуального курса USD -> UZS. Добавьте запись в таблицу exchange_rates."
    );
  }

  return latestRate.rate;
}

export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> {
  const validatedInput: ExpenseInput = expenseSchema.parse(input);
  const exchangeRateUsed = await resolveExchangeRateForCurrency(
    validatedInput.currency
  );
  const amountUsd = normalizeToUsd(
    validatedInput.amount_original,
    validatedInput.currency,
    exchangeRateUsed
  );
  const payload: ExpenseInsert = {
    apartment_id: validatedInput.apartment_id,
    category: validatedInput.category,
    expense_date: validatedInput.expense_date,
    note: validatedInput.note,
    currency: validatedInput.currency,
    amount_original: validatedInput.amount_original,
    amount_usd: amountUsd,
    amount: amountUsd,
    exchange_rate_used: exchangeRateUsed
  };
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .insert(toSupabaseInsert<"expenses">(payload))
    .select("*")
    .single();

  if (isMissingExpenseMoneyColumnError(error)) {
    const { data: legacyExpenseResult, error: legacyError } = await supabase
      .from("expenses")
      .insert(toSupabaseInsert<"expenses">(toLegacyExpensePayload(validatedInput, amountUsd)))
      .select("*")
      .single();

    if (legacyError) {
      throw new Error(`Не удалось создать расход: ${legacyError.message}`);
    }

    return toTableRow<"expenses">(legacyExpenseResult);
  }

  if (error) {
    throw new Error(`Не удалось создать расход: ${error.message}`);
  }

  return toTableRow<"expenses">(expenseResult);
}

export async function updateExpense(
  id: string,
  input: ExpenseUpdateInput
): Promise<ExpenseRow> {
  const existingExpense = await getExpenseById(id);

  if (!existingExpense) {
    throw new Error("Расход не найден.");
  }

  const validatedInput: ExpenseInput = expenseSchema.parse({
    apartment_id: input.apartment_id ?? existingExpense.apartment_id,
    amount_original: input.amount_original ?? existingExpense.amount_original,
    currency: input.currency ?? existingExpense.currency,
    category: input.category ?? existingExpense.category,
    expense_date: input.expense_date ?? existingExpense.expense_date,
    note: input.note ?? existingExpense.note
  });
  const exchangeRateUsed = await resolveExchangeRateForCurrency(
    validatedInput.currency
  );
  const amountUsd = normalizeToUsd(
    validatedInput.amount_original,
    validatedInput.currency,
    exchangeRateUsed
  );
  const payload: ExpenseUpdate = {
    apartment_id: validatedInput.apartment_id,
    category: validatedInput.category,
    expense_date: validatedInput.expense_date,
    note: validatedInput.note,
    currency: validatedInput.currency,
    amount_original: validatedInput.amount_original,
    amount_usd: amountUsd,
    amount: amountUsd,
    exchange_rate_used: exchangeRateUsed
  };
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .update(toSupabaseUpdate<"expenses">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (isMissingExpenseMoneyColumnError(error)) {
    const { data: legacyExpenseResult, error: legacyError } = await supabase
      .from("expenses")
      .update(
        toSupabaseUpdate<"expenses">(
          toLegacyExpensePayload(validatedInput, amountUsd)
        )
      )
      .eq("id", id)
      .select("*")
      .single();

    if (legacyError) {
      throw new Error(`Не удалось обновить расход: ${legacyError.message}`);
    }

    return toTableRow<"expenses">(legacyExpenseResult);
  }

  if (error) {
    throw new Error(`Не удалось обновить расход: ${error.message}`);
  }

  return toTableRow<"expenses">(expenseResult);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Не удалось удалить расход: ${error.message}`);
  }
}
