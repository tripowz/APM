export const appLocales = ["ru", "uz"] as const;
export type AppLocale = (typeof appLocales)[number];

export const displayCurrencies = ["USD", "UZS"] as const;
export type DisplayCurrency = (typeof displayCurrencies)[number];

export const moneyCurrencies = ["USD", "UZS"] as const;
export type MoneyCurrency = (typeof moneyCurrencies)[number];

export const expenseCategories = [
  "cleaning",
  "repair",
  "supplies",
  "utilities",
  "commission",
  "marketing",
  "other"
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export const bookingStatuses = [
  "new",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled"
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const paymentStatuses = ["unpaid", "partial", "paid"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type ExchangeRateSnapshot = {
  rate: number;
  rateDate: string | null;
  source: string | null;
};

