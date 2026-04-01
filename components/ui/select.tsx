"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const EMPTY_OPTION_PREFIX = "__select-empty-option__";

type ParsedOption = {
  value: string;
  internalValue: string;
  label: React.ReactNode;
  disabled: boolean;
};

function parseOptions(children: React.ReactNode) {
  return React.Children.toArray(children).flatMap((child, index) => {
    if (
      !React.isValidElement<{
        value?: string;
        disabled?: boolean;
        children?: React.ReactNode;
      }>(child) ||
      child.type !== "option"
    ) {
      return [];
    }

    const value = String(child.props.value ?? "");

    return [
      {
        value,
        internalValue:
          value === "" ? `${EMPTY_OPTION_PREFIX}-${index}` : value,
        label: child.props.children,
        disabled: Boolean(child.props.disabled)
      }
    ] satisfies ParsedOption[];
  });
}

export type SelectProps = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: React.ReactNode;
  required?: boolean;
  value?: string;
};

export function Select({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  defaultValue,
  disabled = false,
  form,
  id,
  name,
  onValueChange,
  placeholder,
  required = false,
  value
}: SelectProps) {
  const triggerId = React.useId();
  const options = React.useMemo(() => parseOptions(children), [children]);
  const selectableEmptyOption = options.find(
    (option) => option.value === "" && !option.disabled
  );
  const placeholderOption = options.find(
    (option) => option.value === "" && option.disabled
  );
  const fallbackValue =
    defaultValue ??
    (placeholderOption ? "" : options.find((option) => !option.disabled)?.value ?? "");
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const actualValue = isControlled ? value ?? "" : internalValue;

  React.useEffect(() => {
    if (!isControlled) {
      setInternalValue(fallbackValue);
    }
  }, [fallbackValue, isControlled]);

  const valueMap = React.useMemo(
    () => new Map(options.map((option) => [option.internalValue, option.value])),
    [options]
  );

  const selectedInternalValue =
    actualValue === ""
      ? selectableEmptyOption?.internalValue
      : actualValue || undefined;

  const handleValueChange = (nextInternalValue: string) => {
    const nextValue = valueMap.get(nextInternalValue) ?? "";

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          form={form}
          value={actualValue}
          disabled={disabled}
        />
      ) : null}
      <SelectPrimitive.Root
        value={selectedInternalValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id ?? triggerId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-required={required}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-input bg-surface px-4 py-2 text-left text-sm text-foreground outline-none transition-all duration-200 data-[placeholder]:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <SelectPrimitive.Value
            placeholder={placeholder ?? placeholderOption?.label}
          />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={8}
            className="relative z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[24px] border border-border bg-surface text-popover-foreground shadow-card data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          >
            <SelectPrimitive.ScrollUpButton className="flex h-9 items-center justify-center text-muted-foreground">
              <ChevronUp className="size-4" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-2">
              <SelectPrimitive.Group>
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.internalValue}
                    value={option.internalValue}
                    disabled={option.disabled}
                    className="relative flex min-h-11 cursor-default select-none items-center rounded-2xl py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-4 flex size-4 items-center justify-center text-foreground">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="size-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-9 items-center justify-center text-muted-foreground">
              <ChevronDown className="size-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}
