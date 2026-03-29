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
import { Select } from "@/components/ui/select";
import type { AppLocale } from "@/lib/types/domain";

type BusinessSettingsFormProps = {
  initialValues: {
    business_name?: string | null;
    currency?: string | null;
    timezone?: string | null;
  };
  locale?: AppLocale;
};

const initialState: SettingsActionState = {};

function SubmitButton({ locale = "ru" }: { locale?: AppLocale }) {
  const { pending } = useFormStatus();
  const label = locale === "uz" ? "Sozlamalarni saqlash" : "Сохранить настройки";
  const pendingLabel = locale === "uz" ? "Saqlanmoqda..." : "Сохраняем...";

  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function BusinessSettingsForm({
  initialValues,
  locale = "ru"
}: BusinessSettingsFormProps) {
  const [state, formAction] = useActionState(
    saveWorkspaceSettingsAction,
    initialState
  );
  const labels =
    locale === "uz"
      ? {
          businessName: "Biznes nomi",
          currency: "Asosiy valyuta",
          timezone: "Vaqt zonasi",
          currencyHint: "Asosiy hisob va hisobotlar USD bo'yicha yuritiladi.",
          timezoneHint:
            "Kunlik hisobotlar va operatsion sanalar shu vaqt zonasi asosida hisoblanadi."
        }
      : {
          businessName: "Название бизнеса",
          currency: "Основная валюта",
          timezone: "Часовой пояс",
          currencyHint: "Основной учет и отчеты считаются в USD.",
          timezoneHint:
            "Ежедневные отчеты и операционные даты считаются по этому часовому поясу."
        };

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label
            htmlFor="business_name"
            className="text-sm font-medium text-foreground"
          >
            {labels.businessName}
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
            {labels.currency}
          </label>
          <Select
            id="currency"
            name="currency"
            defaultValue={initialValues.currency ?? "USD"}
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </Select>
          <FormMessage tone="muted">{labels.currencyHint}</FormMessage>
          <FormMessage>{state.fieldErrors?.currency?.[0]}</FormMessage>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="timezone" className="text-sm font-medium text-foreground">
          {labels.timezone}
        </label>
        <Input
          id="timezone"
          name="timezone"
          defaultValue={initialValues.timezone ?? "Asia/Tashkent"}
          placeholder="Asia/Tashkent"
          required
        />
        <FormMessage tone="muted">{labels.timezoneHint}</FormMessage>
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
        <SubmitButton locale={locale} />
      </div>
    </form>
  );
}
