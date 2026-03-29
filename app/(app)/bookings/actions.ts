"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BookingConflictError } from "@/lib/bookings/conflicts";
import { canCheckInBooking, canCheckOutBooking } from "@/lib/business/rules";
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  createBooking,
  deleteBooking,
  getBookingById,
  updateBooking
} from "@/lib/data/bookings";
import { formatShortDate, toIsoDate } from "@/lib/dates";
import { resolveLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import {
  createBookingSchema,
  type BookingInput,
  type BookingUpdateInput
} from "@/lib/validations/booking";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type BookingFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const bookingMetaSchema = z.object({
  bookingId: z.string().uuid().optional(),
  returnTo: z.string().optional()
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

function formatBookingConflictMessage(locale: "ru" | "uz", error: BookingConflictError) {
  const from = formatShortDate(error.existingBooking.check_in, locale);
  const to = formatShortDate(error.existingBooking.check_out, locale);

  return locale === "uz"
    ? `Bu kvartira ${error.existingBooking.guest_name} uchun ${from} dan ${to} gacha band.`
    : `Эта квартира уже занята для ${error.existingBooking.guest_name} с ${from} по ${to}.`;
}

export async function saveBookingAction(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const locale = resolveLocale(formData.get("locale"));
  const messages = getMessages(locale);
  const metaParsed = bookingMetaSchema.safeParse({
    bookingId: formData.get("bookingId") || undefined,
    returnTo: formData.get("returnTo") || undefined
  });
  const parsed = createBookingSchema(locale).safeParse({
    apartment_id: formData.get("apartment_id"),
    guest_name: formData.get("guest_name"),
    guest_phone: formData.get("guest_phone"),
    check_in: formData.get("check_in"),
    check_out: formData.get("check_out"),
    currency: formData.get("currency"),
    total_amount_original: formData.get("total_amount_original"),
    prepaid_amount: formData.get("prepaid_amount"),
    payment_status: formData.get("payment_status"),
    booking_status: formData.get("booking_status"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "Bron ma'lumotlarini tekshirib, yana urinib ko'ring."
          : "Проверьте данные брони и попробуйте снова.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (!metaParsed.success) {
    return {
      error: messages.forms.saveError
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
      currency: parsed.data.currency,
      total_amount_original: parsed.data.total_amount_original,
      prepaid_amount: parsed.data.prepaid_amount,
      payment_status: parsed.data.payment_status,
      booking_status: parsed.data.booking_status,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null
    };

    let booking: BookingRow;

    if (metaParsed.data.bookingId) {
      booking = await updateBooking(
        metaParsed.data.bookingId,
        bookingPayload as BookingUpdateInput
      );
    } else {
      booking = await createBooking(bookingPayload);
    }

    revalidateBookingRoutes(booking.apartment_id, booking.id);

    redirect(
      metaParsed.data.returnTo
        ? getSafeReturnPath(metaParsed.data.returnTo)
        : `/bookings/${booking.id}/edit`
    );
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return {
        error: formatBookingConflictMessage(locale, error)
      };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Bronni hozircha saqlab bo'lmadi."
            : "Сейчас не удалось сохранить бронь."
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

async function getExistingBookingOrRedirect(bookingId: string, returnTo: string) {
  const booking = await getBookingById(bookingId);

  if (!booking) {
    redirect(returnTo);
  }

  return booking;
}

export async function checkInBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const returnTo = getSafeReturnPath(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null
  );
  const existing = await getExistingBookingOrRedirect(bookingId, returnTo);
  const today = toIsoDate(new Date());

  if (!canCheckInBooking(existing.booking_status, existing.check_in, today)) {
    redirect(returnTo);
  }

  const updated = await checkInBooking(bookingId);
  revalidateBookingRoutes(updated.apartment_id, bookingId);
  redirect(returnTo);
}

export async function checkOutBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const returnTo = getSafeReturnPath(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null
  );
  const existing = await getExistingBookingOrRedirect(bookingId, returnTo);
  const today = toIsoDate(new Date());

  if (!canCheckOutBooking(existing.booking_status, existing.check_out, today)) {
    redirect(returnTo);
  }

  const updated = await checkOutBooking(bookingId);
  revalidateBookingRoutes(updated.apartment_id, bookingId);
  redirect(returnTo);
}
