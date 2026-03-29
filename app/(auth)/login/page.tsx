import { Building2, ShieldCheck } from "lucide-react";

import { redirectIfAuthenticated } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const resolvedSearchParams = await searchParams;
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
              Apartment Management
            </span>
            <span className="text-xs text-muted-foreground">
              Internal workspace access
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to continue
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Email and password auth is enabled through Supabase. This MVP keeps access intentionally simple for one client business.
          </p>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          Supabase auth is not configured for this environment yet. Add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>{" "}
          for local development or in Vercel project settings.
        </div>
      ) : null}

      <LoginForm nextPath={resolvedSearchParams?.next} />

      <div className="surface-muted flex items-start gap-3 p-4">
        <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-white text-foreground shadow-card">
          <ShieldCheck className="size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">Simple internal auth</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Owner and member accounts live in Supabase Auth, with matching profile rows in the public schema.
          </p>
        </div>
      </div>
    </div>
  );
}
