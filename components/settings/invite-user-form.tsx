"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createUserAction,
  type SettingsActionState
} from "@/app/(app)/settings/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppLocale } from "@/lib/types/domain";

type InviteUserFormProps = {
  enabled: boolean;
  disabledReason?: string;
  locale?: AppLocale;
};

const initialState: SettingsActionState = {};

function SubmitButton({
  disabled,
  locale = "ru"
}: {
  disabled?: boolean;
  locale?: AppLocale;
}) {
  const { pending } = useFormStatus();
  const pendingLabel = locale === "uz" ? "Yaratilmoqda..." : "Создаем...";
  const label = locale === "uz" ? "Foydalanuvchi yaratish" : "Создать пользователя";

  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || disabled}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function InviteUserForm({
  enabled,
  disabledReason,
  locale = "ru"
}: InviteUserFormProps) {
  const [state, formAction] = useActionState(createUserAction, initialState);
  const labels =
    locale === "uz"
      ? {
          fullName: "To'liq ism",
          email: "Elektron pochta",
          role: "Rol",
          member: "Xodim",
          owner: "Egasi",
          hint:
            "Yangi foydalanuvchi Supabase Auth ichida vaqtinchalik parol bilan yaratiladi. Parolni xavfsiz kanal orqali yuboring."
        }
      : {
          fullName: "Имя и фамилия",
          email: "Электронная почта",
          role: "Роль",
          member: "Сотрудник",
          owner: "Владелец",
          hint:
            "Новый пользователь будет создан в Supabase Auth с временным паролем. Передайте его безопасным способом."
        };

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="full_name" className="text-sm font-medium text-foreground">
            {labels.fullName}
          </label>
          <Input
            id="full_name"
            name="full_name"
            placeholder={locale === "uz" ? "Yangi xodim" : "Новый сотрудник"}
            required
            disabled={!enabled}
          />
          <FormMessage>{state.fieldErrors?.full_name?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {labels.email}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="teammate@example.com"
            required
            disabled={!enabled}
          />
          <FormMessage>{state.fieldErrors?.email?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_auto]">
        <div className="flex flex-col gap-2">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            {labels.role}
          </label>
          <Select id="role" name="role" defaultValue="member" disabled={!enabled}>
            <option value="member">{labels.member}</option>
            <option value="owner">{labels.owner}</option>
          </Select>
          <FormMessage>{state.fieldErrors?.role?.[0]}</FormMessage>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
          {labels.hint}
        </div>
      </div>

      {!enabled && disabledReason ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          {disabledReason}
        </div>
      ) : null}

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
        <SubmitButton disabled={!enabled} locale={locale} />
      </div>
    </form>
  );
}
