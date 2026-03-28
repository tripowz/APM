import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  expenseSchema,
  expenseUpdateSchema,
  type ExpenseInput,
  type ExpenseUpdateInput
} from "@/lib/validations/expense";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

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

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  return data;
}

export async function getExpenseById(id: string): Promise<ExpenseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load expense: ${error.message}`);
  }

  return data;
}

export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> {
  const payload = expenseSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  return data;
}

export async function updateExpense(
  id: string,
  input: ExpenseUpdateInput
): Promise<ExpenseRow> {
  const payload = expenseUpdateSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  return data;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
}
