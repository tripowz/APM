"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type LoginFormState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

type LoginFormProps = {
  nextPath?: string;
  locale?: AppLocale;
};

const initialState: LoginFormState = {};

function LocalizedSubmitButton({ locale }: { locale: AppLocale }) {
  const { pending } = useFormStatus();
  const messages = getMessages(locale);

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? messages.auth.submitting : messages.auth.submit}
    </Button>
  );
}

export function LoginForm({
  nextPath = "/dashboard",
  locale = "ru"
}: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialState);
  const messages = getMessages(locale);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {messages.auth.email}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="owner@apm.local"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {messages.auth.password}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          required
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      <LocalizedSubmitButton locale={locale} />
    </form>
  );
}
