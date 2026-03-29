"use server";

import { redirect } from "next/navigation";

import { resolveLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createLoginSchema } from "@/lib/validations/auth";

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
  const locale = resolveLocale(formData.get("locale"));
  const messages = getMessages(locale);

  if (!hasSupabasePublicEnv()) {
    return {
      error: messages.auth.envWarning
    };
  }

  const parsed = createLoginSchema(locale).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? messages.forms.required
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error:
        locale === "uz"
          ? "Kirish amalga oshmadi. Email va parolni tekshiring."
          : "Не удалось войти. Проверьте email и пароль."
    };
  }

  redirect(getSafeNextPath(formData.get("next")));
}
