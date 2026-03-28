"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BookingConflictError } from "@/lib/bookings/conflicts";
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  getBookingById,
  updateBooking
} from "@/lib/data/bookings";
import type { Database } from "@/lib/supabase/database.types";
import type { BookingInput, BookingUpdateInput } from "@/lib/validations/booking";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type BookingFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const bookingFormSchema = z.object({
  bookingId: z.string().uuid().optional(),
  apartment_id: z.string().uuid(),
  guest_name: z.string().trim().min(2, "Guest name is required."),
  guest_phone: z.string().optional(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date is required."),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date is required."),
  total_amount: z.coerce.number().nonnegative("Total amount cannot be negative."),
  prepaid_amount: z.coerce.number().nonnegative("Prepaid amount cannot be negative."),
  payment_status: z.enum(["unpaid", "partial", "paid"]),
  booking_status: z.enum([
    "new",
    "confirmed",
    "checked_in",
    "checked_out",
    "cancelled"
  ]),
  notes: z.string().optional(),
  returnTo: z.string().optional()
})
.refine((value) => value.check_out > value.check_in, {
  path: ["check_out"],
  message: "Check-out must be later than check-in."
})
.refine((value) => value.prepaid_amount <= value.total_amount, {
  path: ["prepaid_amount"],
  message: "Prepaid amount cannot exceed total amount."
});

function getSafeReturnPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/calendar";
  }

  return value;
}

function revalidateBookingRoutes(apartmentId: string, bookingId?: string) {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/apartments");
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath("/bookings");

  if (bookingId) {
    revalidatePath(`/bookings/${bookingId}/edit`);
  }
}

export async function saveBookingAction(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const parsed = bookingFormSchema.safeParse({
    bookingId: formData.get("bookingId") || undefined,
    apartment_id: formData.get("apartment_id"),
    guest_name: formData.get("guest_name"),
    guest_phone: formData.get("guest_phone"),
    check_in: formData.get("check_in"),
    check_out: formData.get("check_out"),
    total_amount: formData.get("total_amount"),
    prepaid_amount: formData.get("prepaid_amount"),
    payment_status: formData.get("payment_status"),
    booking_status: formData.get("booking_status"),
    notes: formData.get("notes"),
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    return {
      error: "Review the booking details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const bookingPayload: BookingInput = {
      apartment_id: parsed.data.apartment_id,
      guest_name: parsed.data.guest_name,
      guest_phone: parsed.data.guest_phone?.trim()
        ? parsed.data.guest_phone.trim()
        : null,
      check_in: parsed.data.check_in,
      check_out: parsed.data.check_out,
      total_amount: parsed.data.total_amount,
      prepaid_amount: parsed.data.prepaid_amount,
      payment_status: parsed.data.payment_status,
      booking_status: parsed.data.booking_status,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null
    };

    let booking: BookingRow;

    if (parsed.data.bookingId) {
      booking = await updateBooking(
        parsed.data.bookingId,
        bookingPayload as BookingUpdateInput
      );
    } else {
      booking = await createBooking(bookingPayload);
    }

    revalidateBookingRoutes(booking.apartment_id, booking.id);

    redirect(getSafeReturnPath(parsed.data.returnTo) || `/bookings/${booking.id}/edit`);
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return {
        error: error.message
      };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the booking right now."
    };
  }
}

export async function cancelBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const returnTo = getSafeReturnPath(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null
  );

  const existingResult = await getBookingById(bookingId);

  if (!existingResult) {
    redirect(returnTo);
  }

  const existing: BookingRow = existingResult;

  await cancelBooking(bookingId);
  revalidateBookingRoutes(existing.apartment_id, bookingId);
  redirect(returnTo);
}

export async function deleteBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const returnTo = getSafeReturnPath(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null
  );

  const existingResult = await getBookingById(bookingId);

  if (!existingResult) {
    redirect(returnTo);
  }

  const existing: BookingRow = existingResult;

  await deleteBooking(bookingId);
  revalidateBookingRoutes(existing.apartment_id, bookingId);
  redirect(returnTo);
}
