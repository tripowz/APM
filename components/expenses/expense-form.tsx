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
import { getMessages } from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import type { AppLocale } from "@/lib/types/domain";

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
  locale?: AppLocale;
};

const initialState: ExpenseFormState = {};

function SubmitButton({
  isEditing,
  disabled,
  locale
}: {
  isEditing: boolean;
  disabled?: boolean;
  locale: AppLocale;
}) {
  const { pending } = useFormStatus();
  const messages = getMessages(locale);

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending || disabled}
    >
      {pending
        ? isEditing
          ? messages.expenses.form.saving
          : messages.expenses.form.creating
        : isEditing
          ? messages.expenses.form.save
          : messages.expenses.form.create}
    </Button>
  );
}

export function ExpenseForm({
  expense,
  apartments,
  defaultApartmentId,
  returnTo,
  locale = "ru"
}: ExpenseFormProps) {
  const [state, formAction] = useActionState(saveExpenseAction, initialState);
  const isEditing = Boolean(expense);
  const hasApartments = apartments.length > 0;
  const messages = getMessages(locale);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="expenseId" value={expense?.id ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo ?? "/expenses"} />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label
            htmlFor="apartment_id"
            className="text-sm font-medium text-foreground"
          >
            {messages.expenses.form.apartment}
          </label>
          <Select
            id="apartment_id"
            name="apartment_id"
            defaultValue={expense?.apartment_id ?? defaultApartmentId ?? ""}
            required
            disabled={!hasApartments}
          >
            <option value="" disabled>
              {hasApartments
                ? messages.expenses.form.apartment
                : messages.bookings.noApartments}
            </option>
            {apartments.map((apartment: ApartmentOption) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <FormMessage>{state.fieldErrors?.apartment_id?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="amount_original"
            className="text-sm font-medium text-foreground"
          >
            {messages.expenses.form.amount}
          </label>
          <Input
            id="amount_original"
            name="amount_original"
            type="number"
            min="0"
            step="1"
            defaultValue={expense?.amount_original ?? expense?.amount ?? 0}
            required
          />
          <FormMessage>{state.fieldErrors?.amount_original?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="currency" className="text-sm font-medium text-foreground">
            {messages.expenses.form.currency}
          </label>
          <Select
            id="currency"
            name="currency"
            defaultValue={expense?.currency ?? "USD"}
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            {messages.expenses.form.category}
          </label>
          <Select
            id="category"
            name="category"
            defaultValue={expense?.category ?? "cleaning"}
          >
            <option value="cleaning">{messages.statuses.expenseCategory.cleaning}</option>
            <option value="repair">{messages.statuses.expenseCategory.repair}</option>
            <option value="supplies">{messages.statuses.expenseCategory.supplies}</option>
            <option value="utilities">{messages.statuses.expenseCategory.utilities}</option>
            <option value="commission">{messages.statuses.expenseCategory.commission}</option>
            <option value="marketing">{messages.statuses.expenseCategory.marketing}</option>
            <option value="other">{messages.statuses.expenseCategory.other}</option>
          </Select>
          <FormMessage>{state.fieldErrors?.category?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="expense_date"
            className="text-sm font-medium text-foreground"
          >
            {messages.expenses.form.expenseDate}
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
          {messages.expenses.form.note}
        </label>
        <Textarea
          id="note"
          name="note"
          defaultValue={expense?.note ?? ""}
          placeholder={messages.expenses.form.placeholder}
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      {!hasApartments ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          {messages.bookings.noApartments}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton
          isEditing={isEditing}
          disabled={!hasApartments}
          locale={locale}
        />
      </div>
    </form>
  );
}
