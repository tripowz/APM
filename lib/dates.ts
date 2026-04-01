import { getLocaleTag } from "@/lib/currency";
import type { AppLocale } from "@/lib/types/domain";

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const timeZoneFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getTimeZoneFormatter(timeZone: string) {
  if (!timeZoneFormatterCache.has(timeZone)) {
    timeZoneFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
    );
  }

  return timeZoneFormatterCache.get(timeZone)!;
}

function getFormatter(
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions
) {
  const localeTag = getLocaleTag(locale);
  const key = `${localeTag}:${JSON.stringify(options)}`;

  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.DateTimeFormat(localeTag, {
        ...options,
        timeZone: "UTC"
      })
    );
  }

  return formatterCache.get(key)!;
}

export function isValidTimeZone(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const parts = getTimeZoneFormatter(timeZone).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

export function parseIsoDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isIsoDateString(value?: string | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = parseIsoDate(value);

  return !Number.isNaN(parsedDate.getTime()) && toIsoDate(parsedDate) === value;
}

export function getValidIsoDate(value?: string | null) {
  return isIsoDateString(value) ? value : null;
}

function isIsoMonthString(value?: string | null): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return Number.isInteger(year) && month >= 1 && month <= 12;
}

export function toIsoDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function getCurrentDateInTimeZone(timeZone = "UTC", date = new Date()) {
  const { year, month, day } = getTimeZoneDateParts(date, timeZone);

  return new Date(Date.UTC(year, month - 1, day));
}

export function getTodayIso(timeZone = "UTC") {
  return toIsoDate(getCurrentDateInTimeZone(timeZone));
}

export function getMonthStart(month?: string, timeZone = "UTC") {
  if (isIsoMonthString(month)) {
    const [year, rawMonth] = month.split("-").map(Number);
    return new Date(Date.UTC(year, rawMonth - 1, 1));
  }

  const today = getCurrentDateInTimeZone(timeZone);
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
}

export function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function formatMonthLabel(date: Date, locale: AppLocale = "ru") {
  return getFormatter(locale, {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatShortDate(date: string | Date, locale: AppLocale = "ru") {
  return getFormatter(locale, {
    month: "short",
    day: "numeric"
  }).format(typeof date === "string" ? parseIsoDate(date) : date);
}

export function formatWeekday(date: Date, locale: AppLocale = "ru") {
  return getFormatter(locale, {
    weekday: "short"
  }).format(date);
}

export function eachDayOfInterval(start: Date, end: Date) {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

export function getCalendarGrid(monthStart: Date, timeZone = "UTC") {
  const firstDay = new Date(monthStart);
  const month = firstDay.getUTCMonth();
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());

  const lastDay = new Date(Date.UTC(firstDay.getUTCFullYear(), month + 1, 0));
  const gridEnd = new Date(lastDay);
  gridEnd.setUTCDate(lastDay.getUTCDate() + (6 - lastDay.getUTCDay()));
  const todayIso = getTodayIso(timeZone);

  return eachDayOfInterval(gridStart, gridEnd).map((date: Date) => ({
    date,
    iso: toIsoDate(date),
    isCurrentMonth: date.getUTCMonth() === month,
    isToday: toIsoDate(date) === todayIso
  }));
}

export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return startA < endB && endA > startB;
}

export function isDateWithinBooking(date: string, checkIn: string, checkOut: string) {
  return date >= checkIn && date < checkOut;
}
