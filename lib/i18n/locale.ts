import type { AppLocale } from "@/lib/types/domain";

export function resolveLocale(value: FormDataEntryValue | null | undefined): AppLocale {
  return value === "uz" ? "uz" : "ru";
}
