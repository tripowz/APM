const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US"
) {
  const key = `${locale}:${currency}`;

  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      })
    );
  }

  return currencyFormatterCache.get(key)!.format(value);
}

export function formatCompactNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
