"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { loginSchema } from "@/lib/validations/auth";

export type LoginFormState = {
  error?: string;
};

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function signInAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  if (!hasSupabasePublicEnv()) {
    return {
      error:
        "Supabase auth is not configured for this environment yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local or Vercel project settings."
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email and password."
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: error.message
    };
  }

  redirect(getSafeNextPath(formData.get("next")));
}
