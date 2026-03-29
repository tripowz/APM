"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  saveBookingAction,
  type BookingFormState
} from "@/app/(app)/bookings/actions";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getMessages } from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import type { AppLocale } from "@/lib/types/domain";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ApartmentOption = Pick<
  Database["public"]["Tables"]["apartments"]["Row"],
  "id" | "title" | "status"
>;

type BookingFormProps = {
  booking?: BookingRow | null;
  apartments: ApartmentOption[];
  defaultApartmentId?: string;
  returnTo?: string;
  locale?: AppLocale;
};

const initialState: BookingFormState = {};

function SubmitButton({
  isEditing,
  disabled,
  locale
}: {
  isEditing: boolean;
  disabled?: boolean;
  locale: AppLocale;
}) {
  const { pending } = useFormStatus();
  const messages = getMessages(locale);

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending || disabled}
    >
      {pending
        ? isEditing
          ? messages.bookings.submitEditing
          : messages.bookings.submitCreating
        : isEditing
          ? messages.bookings.submitEdit
          : messages.bookings.submitCreate}
    </Button>
  );
}

export function BookingForm({
  booking,
  apartments,
  defaultApartmentId,
  returnTo,
  locale = "ru"
}: BookingFormProps) {
  const [state, formAction] = useActionState(saveBookingAction, initialState);
  const isEditing = Boolean(booking);
  const hasApartments = apartments.length > 0;
  const messages = getMessages(locale);
  const notesPlaceholder =
    locale === "uz"
      ? "Domofon kodi, kelish tafsilotlari yoki mehmon bo'yicha muhim izohlar."
      : "Код домофона, детали заезда или важные комментарии по гостю.";

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="bookingId" value={booking?.id ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo ?? "/calendar"} />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="apartment_id"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.apartment}
          </label>
          <Select
            id="apartment_id"
            name="apartment_id"
            defaultValue={booking?.apartment_id ?? defaultApartmentId ?? ""}
            required
            disabled={!hasApartments}
          >
            <option value="" disabled>
              {hasApartments
                ? messages.bookings.selectApartment
                : messages.bookings.noApartments}
            </option>
            {apartments.map((apartment: ApartmentOption) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
                {apartment.status === "inactive"
                  ? ` (${messages.statuses.apartmentStatus.inactive.toLowerCase()})`
                  : ""}
              </option>
            ))}
          </Select>
          <FormMessage>{state.fieldErrors?.apartment_id?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="guest_name"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.guestName}
          </label>
          <Input
            id="guest_name"
            name="guest_name"
            defaultValue={booking?.guest_name ?? ""}
            placeholder="Madina Yusupova"
            required
          />
          <FormMessage>{state.fieldErrors?.guest_name?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="guest_phone"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.guestPhone}
          </label>
          <Input
            id="guest_phone"
            name="guest_phone"
            defaultValue={booking?.guest_phone ?? ""}
            placeholder="+998901112233"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="check_in" className="text-sm font-medium text-foreground">
            {messages.bookings.checkIn}
          </label>
          <Input
            id="check_in"
            name="check_in"
            type="date"
            defaultValue={booking?.check_in ?? ""}
            required
          />
          <FormMessage>{state.fieldErrors?.check_in?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="check_out" className="text-sm font-medium text-foreground">
            {messages.bookings.checkOut}
          </label>
          <Input
            id="check_out"
            name="check_out"
            type="date"
            defaultValue={booking?.check_out ?? ""}
            required
          />
          <FormMessage>{state.fieldErrors?.check_out?.[0]}</FormMessage>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="currency"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.currency}
          </label>
          <Select
            id="currency"
            name="currency"
            defaultValue={booking?.currency ?? "USD"}
          >
            <option value="USD">USD</option>
            <option value="UZS">UZS</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="total_amount_original"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.totalAmount}
          </label>
          <Input
            id="total_amount_original"
            name="total_amount_original"
            type="number"
            min="0"
            step="1"
            defaultValue={
              booking?.total_amount_original ?? booking?.total_amount ?? 0
            }
            required
          />
          <FormMessage>{state.fieldErrors?.total_amount_original?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="prepaid_amount"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.prepaidAmount}
          </label>
          <Input
            id="prepaid_amount"
            name="prepaid_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={booking?.prepaid_amount ?? 0}
            required
          />
          <FormMessage>{state.fieldErrors?.prepaid_amount?.[0]}</FormMessage>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="payment_status"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.paymentStatus}
          </label>
          <Select
            id="payment_status"
            name="payment_status"
            defaultValue={booking?.payment_status ?? "unpaid"}
          >
            <option value="unpaid">{messages.statuses.payment.unpaid}</option>
            <option value="partial">{messages.statuses.payment.partial}</option>
            <option value="paid">{messages.statuses.payment.paid}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="booking_status"
            className="text-sm font-medium text-foreground"
          >
            {messages.bookings.bookingStatus}
          </label>
          <Select
            id="booking_status"
            name="booking_status"
            defaultValue={booking?.booking_status ?? "new"}
          >
            <option value="new">{messages.statuses.booking.new}</option>
            <option value="confirmed">{messages.statuses.booking.confirmed}</option>
            <option value="checked_in">{messages.statuses.booking.checked_in}</option>
            <option value="checked_out">{messages.statuses.booking.checked_out}</option>
            <option value="cancelled">{messages.statuses.booking.cancelled}</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          {messages.bookings.notes}
        </label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={booking?.notes ?? ""}
          placeholder={notesPlaceholder}
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      ) : null}

      {!hasApartments ? (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          {messages.bookings.noApartments}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton
          isEditing={isEditing}
          disabled={!hasApartments}
          locale={locale}
        />
      </div>
    </form>
  );
}
