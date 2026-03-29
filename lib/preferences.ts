import { cookies } from "next/headers";

import type { AppLocale, DisplayCurrency } from "@/lib/types/domain";

export const LOCALE_COOKIE_NAME = "apm_locale";
export const DISPLAY_CURRENCY_COOKIE_NAME = "apm_display_currency";

export const DEFAULT_LOCALE: AppLocale = "ru";
export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = "USD";

function normalizeLocale(value?: string | null): AppLocale {
  return value === "uz" ? "uz" : "ru";
}

function normalizeDisplayCurrency(value?: string | null): DisplayCurrency {
  return value === "UZS" ? "UZS" : "USD";
}

export async function getAppPreferences() {
  const cookieStore = await cookies();

  return {
    locale: normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value),
    displayCurrency: normalizeDisplayCurrency(
      cookieStore.get(DISPLAY_CURRENCY_COOKIE_NAME)?.value
    )
  };
}

