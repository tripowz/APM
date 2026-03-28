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

type UserRoleFormProps = {
  userId: string;
  role: "owner" | "member";
  disabled?: boolean;
  helperText?: string;
};

const initialState: SettingsActionState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending || disabled}>
      {pending ? "Saving..." : "Save role"}
    </Button>
  );
}

export function UserRoleForm({
  userId,
  role,
  disabled,
  helperText
}: UserRoleFormProps) {
  const [state, formAction] = useActionState(updateUserRoleAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Select
          name="role"
          defaultValue={role}
          className="min-w-[140px]"
          disabled={disabled}
        >
          <option value="owner">Owner</option>
          <option value="member">Member</option>
        </Select>
        <SubmitButton disabled={disabled} />
      </div>
      {helperText ? <FormMessage tone="muted">{helperText}</FormMessage> : null}
      {state.error ? <FormMessage>{state.error}</FormMessage> : null}
      {state.success ? <FormMessage tone="muted">{state.success}</FormMessage> : null}
    </form>
  );
}
