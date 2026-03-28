"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  saveWorkspaceSettingsAction,
  type SettingsActionState
} from "@/app/(app)/settings/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BusinessSettingsFormProps = {
  initialValues: {
    business_name?: string | null;
    currency?: string | null;
    timezone?: string | null;
  };
};

const initialState: SettingsActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Saving settings..." : "Save settings"}
    </Button>
  );
}

export function BusinessSettingsForm({
  initialValues
}: BusinessSettingsFormProps) {
  const [state, formAction] = useActionState(
    saveWorkspaceSettingsAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label
            htmlFor="business_name"
            className="text-sm font-medium text-foreground"
          >
            Business name
          </label>
          <Input
            id="business_name"
            name="business_name"
            defaultValue={initialValues.business_name ?? ""}
            placeholder="Sapphire Stay Management"
            required
          />
          <FormMessage>{state.fieldErrors?.business_name?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currency" className="text-sm font-medium text-foreground">
            Currency
          </label>
          <Input
            id="currency"
            name="currency"
            defaultValue={initialValues.currency ?? "USD"}
            placeholder="USD"
            required
          />
          <FormMessage tone="muted">
            Use a short code like USD, EUR, or UZS.
          </FormMessage>
          <FormMessage>{state.fieldErrors?.currency?.[0]}</FormMessage>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="timezone" className="text-sm font-medium text-foreground">
          Timezone
        </label>
        <Input
          id="timezone"
          name="timezone"
          defaultValue={initialValues.timezone ?? "Asia/Tashkent"}
          placeholder="Asia/Tashkent"
          required
        />
        <FormMessage tone="muted">
          This timezone is used for dashboard summaries and future scheduling.
        </FormMessage>
        <FormMessage>{state.fieldErrors?.timezone?.[0]}</FormMessage>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {state.success}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
