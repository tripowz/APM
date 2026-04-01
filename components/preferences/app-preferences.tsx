"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import {
  DISPLAY_CURRENCY_COOKIE_NAME,
  LOCALE_COOKIE_NAME
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
      <Select
        id="locale-switcher"
        value={locale}
        onValueChange={(nextLocale) => handleLocaleChange(nextLocale as AppLocale)}
        className="min-w-[126px]"
      >
        <option value="ru">{messages.topbar.languageRu}</option>
        <option value="uz">{messages.topbar.languageUz}</option>
      </Select>

      <label className="sr-only" htmlFor="currency-switcher">
        {messages.topbar.currency}
      </label>
      <Select
        id="currency-switcher"
        value={displayCurrency}
        onValueChange={(nextCurrency) =>
          handleCurrencyChange(nextCurrency as DisplayCurrency)
        }
        className="min-w-[126px]"
      >
        <option value="USD">{messages.topbar.currencyUsd}</option>
        <option value="UZS">{messages.topbar.currencyUzs}</option>
      </Select>
    </div>
  );
}
