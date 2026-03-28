import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  toTableRow,
  toMaybeTableRow,
  toSupabaseInsert,
  toSupabaseUpdate,
  toTableRows
} from "@/lib/supabase/tables";
import {
  expenseSchema,
  expenseUpdateSchema,
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
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  const expenses: ExpenseRow[] = toTableRows<"expenses">(expensesResult);

  return expenses;
}

export async function getExpenseById(id: string): Promise<ExpenseRow | null> {
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load expense: ${error.message}`);
  }

  return toMaybeTableRow<"expenses">(expenseResult);
}

export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> {
  const payload: ExpenseInsert = expenseSchema.parse(input);
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .insert(toSupabaseInsert<"expenses">(payload))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  return toTableRow<"expenses">(expenseResult);
}

export async function updateExpense(
  id: string,
  input: ExpenseUpdateInput
): Promise<ExpenseRow> {
  const payload: ExpenseUpdate = expenseUpdateSchema.parse(input);
  const supabase = await createClient();
  const { data: expenseResult, error } = await supabase
    .from("expenses")
    .update(toSupabaseUpdate<"expenses">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  return toTableRow<"expenses">(expenseResult);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
}
