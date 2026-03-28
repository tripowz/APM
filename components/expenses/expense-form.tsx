"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  saveExpenseAction,
  type ExpenseFormState
} from "@/app/(app)/expenses/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/database.types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ApartmentOption = Pick<
  Database["public"]["Tables"]["apartments"]["Row"],
  "id" | "title" | "status"
>;

type ExpenseFormProps = {
  expense?: ExpenseRow | null;
  apartments: ApartmentOption[];
  defaultApartmentId?: string;
  returnTo?: string;
};

const initialState: ExpenseFormState = {};

function SubmitButton({
  isEditing,
  disabled
}: {
  isEditing: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending || disabled}
    >
      {pending
        ? isEditing
          ? "Saving expense..."
          : "Creating expense..."
        : isEditing
          ? "Save expense"
          : "Create expense"}
    </Button>
  );
}

export function ExpenseForm({
  expense,
  apartments,
  defaultApartmentId,
  returnTo
}: ExpenseFormProps) {
  const [state, formAction] = useActionState(saveExpenseAction, initialState);
  const isEditing = Boolean(expense);
  const hasApartments = apartments.length > 0;

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="expenseId" value={expense?.id ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo ?? "/expenses"} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label
            htmlFor="apartment_id"
            className="text-sm font-medium text-foreground"
          >
            Apartment
          </label>
          <Select
            id="apartment_id"
            name="apartment_id"
            defaultValue={expense?.apartment_id ?? defaultApartmentId ?? ""}
            required
            disabled={!hasApartments}
          >
            <option value="" disabled>
              {hasApartments ? "Select apartment" : "No apartments available"}
            </option>
            {apartments.map((apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <FormMessage>{state.fieldErrors?.apartment_id?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="1"
            defaultValue={expense?.amount ?? 0}
            required
          />
          <FormMessage>{state.fieldErrors?.amount?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Category
          </label>
          <Select
            id="category"
            name="category"
            defaultValue={expense?.category ?? "cleaning"}
          >
            <option value="cleaning">Cleaning</option>
            <option value="repair">Repair</option>
            <option value="supplies">Supplies</option>
            <option value="utilities">Utilities</option>
            <option value="commission">Commission</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </Select>
          <FormMessage>{state.fieldErrors?.category?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="expense_date"
            className="text-sm font-medium text-foreground"
          >
            Expense date
          </label>
          <Input
            id="expense_date"
            name="expense_date"
            type="date"
            defaultValue={expense?.expense_date ?? ""}
            required
          />
          <FormMessage>{state.fieldErrors?.expense_date?.[0]}</FormMessage>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm font-medium text-foreground">
          Note
        </label>
        <Textarea
          id="note"
          name="note"
          defaultValue={expense?.note ?? ""}
          placeholder="What was this expense for?"
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      {!hasApartments ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          Add an apartment before recording an expense.
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton isEditing={isEditing} disabled={!hasApartments} />
      </div>
    </form>
  );
}
