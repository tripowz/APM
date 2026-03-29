import "server-only";

import { cookies } from "next/headers";

import type { AppLocale, DisplayCurrency } from "@/lib/types/domain";
import {
  DEFAULT_DISPLAY_CURRENCY,
  DEFAULT_LOCALE,
  DISPLAY_CURRENCY_COOKIE_NAME,
  LOCALE_COOKIE_NAME
} from "@/lib/preferences/constants";

function normalizeLocale(value?: string | null): AppLocale {
  return value === "uz" ? "uz" : DEFAULT_LOCALE;
}

function normalizeDisplayCurrency(value?: string | null): DisplayCurrency {
  return value === "UZS" ? "UZS" : DEFAULT_DISPLAY_CURRENCY;
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
