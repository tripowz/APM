"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateUserRoleAction,
  type SettingsActionState
} from "@/app/(app)/settings/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { AppLocale } from "@/lib/types/domain";

type UserRoleFormProps = {
  userId: string;
  role: "owner" | "member";
  disabled?: boolean;
  helperText?: string;
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
  const pendingLabel = locale === "uz" ? "Saqlanmoqda..." : "Сохраняем...";
  const label = locale === "uz" ? "Rolni saqlash" : "Сохранить роль";

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending || disabled}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function UserRoleForm({
  userId,
  role,
  disabled,
  helperText,
  locale = "ru"
}: UserRoleFormProps) {
  const [state, formAction] = useActionState(updateUserRoleAction, initialState);
  const ownerLabel = locale === "uz" ? "Egasi" : "Владелец";
  const memberLabel = locale === "uz" ? "Xodim" : "Сотрудник";

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Select
          name="role"
          defaultValue={role}
          className="min-w-[140px]"
          disabled={disabled}
        >
          <option value="owner">{ownerLabel}</option>
          <option value="member">{memberLabel}</option>
        </Select>
        <SubmitButton disabled={disabled} locale={locale} />
      </div>
      {helperText ? <FormMessage tone="muted">{helperText}</FormMessage> : null}
      {state.error ? <FormMessage>{state.error}</FormMessage> : null}
      {state.success ? <FormMessage tone="muted">{state.success}</FormMessage> : null}
    </form>
  );
}
