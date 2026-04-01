"use client";

import * as React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocaleTag } from "@/lib/currency";
import type { AppLocale } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  max?: string;
  min?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
  locale?: AppLocale;
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export function DatePicker({
  className,
  defaultValue,
  disabled = false,
  form,
  id,
  max,
  min,
  name,
  onValueChange,
  placeholder,
  required = false,
  value,
  locale = "ru"
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isControlled = value !== undefined;
  const fallbackValue = defaultValue ?? "";
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const currentValue = isControlled ? value ?? "" : internalValue;
  const selectedDate = currentValue ? parseLocalDate(currentValue) : undefined;
  const labelFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(locale), {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
    [locale]
  );

  React.useEffect(() => {
    if (!isControlled) {
      setInternalValue(fallbackValue);
    }
  }, [fallbackValue, isControlled]);

  const resolvedPlaceholder =
    placeholder ?? (locale === "uz" ? "Sana tanlang" : "Выберите дату");

  const handleSelect = (date?: Date) => {
    if (!date) {
      return;
    }

    const nextValue = toLocalIsoDate(date);

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) {
      return;
    }

    setIsOpen(nextOpen);
  };

  const isDateDisabled = (date: Date) => {
    const isoDate = toLocalIsoDate(date);

    if (min && isoDate < min) {
      return true;
    }

    if (max && isoDate > max) {
      return true;
    }

    return false;
  };

  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          form={form}
          value={currentValue}
          disabled={disabled}
        />
      ) : null}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            data-required={required ? "" : undefined}
            disabled={disabled}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-input bg-surface px-4 py-2 text-left text-sm text-foreground outline-none transition-all duration-200 focus:border-foreground/30 focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <span
              className={cn(
                "truncate",
                !currentValue && "text-muted-foreground"
              )}
            >
              {selectedDate
                ? labelFormatter.format(selectedDate)
                : resolvedPlaceholder}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <ChevronDown className="size-4" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto max-w-[calc(100vw-1.5rem)] p-2"
        >
          <Calendar
            appLocale={locale}
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? (min ? parseLocalDate(min) : new Date())}
            disabled={isDateDisabled}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
