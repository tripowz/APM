"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  saveApartmentAction,
  type ApartmentFormState
} from "@/app/(app)/apartments/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type ApartmentFormProps = {
  apartment?: ApartmentRow | null;
};

const initialState: ApartmentFormState = {};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
      {pending
        ? isEditing
          ? "Saving apartment..."
          : "Creating apartment..."
        : isEditing
          ? "Save apartment"
          : "Create apartment"}
    </Button>
  );
}

export function ApartmentForm({ apartment }: ApartmentFormProps) {
  const [state, formAction] = useActionState(saveApartmentAction, initialState);
  const isEditing = Boolean(apartment);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="apartmentId" value={apartment?.id ?? ""} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Apartment title
          </label>
          <Input
            id="title"
            name="title"
            defaultValue={apartment?.title ?? ""}
            placeholder="Riverside Loft"
            required
          />
          <FormMessage>{state.fieldErrors?.title?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-sm font-medium text-foreground">
            Status
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={apartment?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <FormMessage>{state.fieldErrors?.status?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm font-medium text-foreground">
            Address
          </label>
          <Input
            id="address"
            name="address"
            defaultValue={apartment?.address ?? ""}
            placeholder="12 Amir Temur Avenue, Tashkent"
            required
          />
          <FormMessage>{state.fieldErrors?.address?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="base_price"
            className="text-sm font-medium text-foreground"
          >
            Base price
          </label>
          <Input
            id="base_price"
            name="base_price"
            type="number"
            min="0"
            step="1"
            defaultValue={apartment?.base_price ?? 0}
            required
          />
          <FormMessage>{state.fieldErrors?.base_price?.[0]}</FormMessage>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Notes
        </label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={apartment?.notes ?? ""}
          placeholder="Operational notes, cleaning instructions, or access details."
        />
        <FormMessage tone="muted">
          Keep notes practical for internal operations.
        </FormMessage>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}
