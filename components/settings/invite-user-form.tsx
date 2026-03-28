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

type InviteUserFormProps = {
  enabled: boolean;
  disabledReason?: string;
};

const initialState: SettingsActionState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || disabled}>
      {pending ? "Creating user..." : "Create user"}
    </Button>
  );
}

export function InviteUserForm({
  enabled,
  disabledReason
}: InviteUserFormProps) {
  const [state, formAction] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="full_name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="New team member"
            required
            disabled={!enabled}
          />
          <FormMessage>{state.fieldErrors?.full_name?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
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
            Role
          </label>
          <Select id="role" name="role" defaultValue="member" disabled={!enabled}>
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </Select>
          <FormMessage>{state.fieldErrors?.role?.[0]}</FormMessage>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
          New users are created in Supabase Auth with a temporary password.
          Share that password securely and have them change it after first sign-in.
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
        <SubmitButton disabled={!enabled} />
      </div>
    </form>
  );
}
