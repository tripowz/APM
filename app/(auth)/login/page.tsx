import { Building2, ShieldCheck } from "lucide-react";

import { redirectIfAuthenticated } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const [resolvedSearchParams, preferences] = await Promise.all([
    searchParams,
    getAppPreferences()
  ]);
  const messages = getMessages(preferences.locale);
  const isSupabaseConfigured = hasSupabasePublicEnv();

  return (
    <div className="surface-panel flex flex-col gap-8 px-6 py-7 sm:px-7 sm:py-8">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {messages.app.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {messages.app.subtitle}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {messages.auth.title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {messages.auth.description}
          </p>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          {messages.auth.envWarning}
        </div>
      ) : null}

      <LoginForm nextPath={resolvedSearchParams?.next} locale={preferences.locale} />

      <div className="surface-muted flex items-start gap-3 p-4">
        <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-white text-foreground shadow-card">
          <ShieldCheck className="size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {messages.auth.helperTitle}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {messages.auth.helperDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
