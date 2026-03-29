"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

import {
  DISPLAY_CURRENCY_COOKIE_NAME,
  LOCALE_COOKIE_NAME,
} from "@/lib/preferences/constants";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale, DisplayCurrency } from "@/lib/types/domain";

type AppPreferencesProps = {
  locale: AppLocale;
  displayCurrency: DisplayCurrency;
};

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function AppPreferences({
  locale,
  displayCurrency,
}: AppPreferencesProps) {
  const router = useRouter();
  const messages = getMessages(locale);

  const handleLocaleChange = (nextLocale: AppLocale) => {
    localStorage.setItem(LOCALE_COOKIE_NAME, nextLocale);
    setCookie(LOCALE_COOKIE_NAME, nextLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCurrencyChange = (nextCurrency: DisplayCurrency) => {
    localStorage.setItem(DISPLAY_CURRENCY_COOKIE_NAME, nextCurrency);
    setCookie(DISPLAY_CURRENCY_COOKIE_NAME, nextCurrency);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="locale-switcher">
        {messages.topbar.language}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
        className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground"
      >
        <option value="ru">{messages.topbar.languageRu}</option>
        <option value="uz">{messages.topbar.languageUz}</option>
      </select>

      <label className="sr-only" htmlFor="currency-switcher">
        {messages.topbar.currency}
      </label>
      <select
        id="currency-switcher"
        value={displayCurrency}
        onChange={(event) =>
          handleCurrencyChange(event.target.value as DisplayCurrency)
        }
        className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground"
      >
        <option value="USD">{messages.topbar.currencyUsd}</option>
        <option value="UZS">{messages.topbar.currencyUzs}</option>
      </select>
    </div>
  );
}
