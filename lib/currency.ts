import { getMessages } from "@/lib/i18n/messages";
import type {
  AppLocale,
  DisplayCurrency,
  ExchangeRateSnapshot,
  MoneyCurrency
} from "@/lib/types/domain";

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export function getLocaleTag(locale: AppLocale) {
  return locale === "uz" ? "uz-UZ" : "ru-RU";
}

export function formatCurrency(
  value: number,
  currency: MoneyCurrency | DisplayCurrency,
  locale: AppLocale
) {
  const localeTag = getLocaleTag(locale);
  const key = `${localeTag}:${currency}`;

  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "UZS" ? 0 : 2
      })
    );
  }

  return currencyFormatterCache.get(key)!.format(value);
}

export function convertUsdToDisplay(
  amountUsd: number,
  displayCurrency: DisplayCurrency,
  rateSnapshot: ExchangeRateSnapshot | null
) {
  if (displayCurrency === "USD") {
    return amountUsd;
  }

  const rate = rateSnapshot?.rate ?? 0;

  if (rate <= 0) {
    return amountUsd;
  }

  return amountUsd * rate;
}

export function formatUsdForDisplay(
  amountUsd: number,
  displayCurrency: DisplayCurrency,
  locale: AppLocale,
  rateSnapshot: ExchangeRateSnapshot | null
) {
  const hasRate = displayCurrency === "USD" || Boolean(rateSnapshot?.rate);
  const targetCurrency = hasRate ? displayCurrency : "USD";
  const converted = convertUsdToDisplay(amountUsd, displayCurrency, rateSnapshot);
  return formatCurrency(converted, targetCurrency, locale);
}

export function getMoneyMeta(
  displayCurrency: DisplayCurrency,
  locale: AppLocale,
  rateSnapshot: ExchangeRateSnapshot | null
) {
  const messages = getMessages(locale);

  if (displayCurrency === "USD") {
    return {
      currencyLabel: messages.topbar.currencyUsd,
      exchangeRateLabel: null
    };
  }

  return {
    currencyLabel: messages.topbar.currencyUzs,
    exchangeRateLabel: rateSnapshot?.rate
      ? `1 USD = ${formatCurrency(rateSnapshot.rate, "UZS", locale)}`
      : null
  };
}

export function normalizeToUsd(
  amountOriginal: number,
  currency: MoneyCurrency,
  exchangeRateUsed: number
) {
  if (currency === "USD") {
    return amountOriginal;
  }

  if (exchangeRateUsed <= 0) {
    throw new Error("Курс должен быть больше нуля для сумм в UZS.");
  }

  return amountOriginal / exchangeRateUsed;
}

