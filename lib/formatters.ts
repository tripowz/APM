import {
  formatCurrency as formatMoney,
  formatUsdForDisplay,
  getLocaleTag,
} from "@/lib/currency";
import type {
  AppLocale,
  DisplayCurrency,
  ExchangeRateSnapshot,
  MoneyCurrency,
} from "@/lib/types/domain";

export function formatCurrency(
  value: number,
  currency: MoneyCurrency = "USD",
  locale: AppLocale = "ru"
) {
  return formatMoney(value, currency, locale);
}

export function formatUsdAmount(
  valueUsd: number,
  displayCurrency: DisplayCurrency,
  locale: AppLocale,
  rateSnapshot: ExchangeRateSnapshot | null
) {
  return formatUsdForDisplay(valueUsd, displayCurrency, locale, rateSnapshot);
}

export function formatCompactNumber(value: number, locale: AppLocale = "ru") {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
