import "server-only";

import { BookingConflictError, findBookingConflict } from "@/lib/bookings/conflicts";
import { normalizeToUsd } from "@/lib/currency";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  toMaybeTableRow,
  toSupabaseInsert,
  toSupabaseUpdate,
  toTableRow,
  toTableRows
} from "@/lib/supabase/tables";
import {
  bookingSchema,
  type BookingInput,
  type BookingUpdateInput
} from "@/lib/validations/booking";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
type BookingConflictCandidate = Pick<
  BookingRow,
  "id" | "guest_name" | "check_in" | "check_out" | "booking_status"
>;

type ListBookingFilters = {
  apartmentId?: string;
  month?: string;
  includeCancelled?: boolean;
};

export async function listBookings(
  filters: ListBookingFilters = {}
): Promise<BookingRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*")
    .order("check_in", { ascending: true });

  if (filters.apartmentId) {
    query = query.eq("apartment_id", filters.apartmentId);
  }

  if (filters.month) {
    const monthStart = `${filters.month}-01`;
    const monthStartDate = new Date(`${monthStart}T00:00:00.000Z`);
    const nextMonth = new Date(
      Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 1)
    );
    const nextMonthIso = nextMonth.toISOString().slice(0, 10);
    query = query.lt("check_in", nextMonthIso).gt("check_out", monthStart);
  }

  if (!filters.includeCancelled) {
    query = query.neq("booking_status", "cancelled");
  }

  const { data: bookingsResult, error } = await query;

  if (error) {
    throw new Error(`Не удалось загрузить бронирования: ${error.message}`);
  }

  return toTableRows<"bookings">(bookingsResult);
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Не удалось загрузить бронь: ${error.message}`);
  }

  return toMaybeTableRow<"bookings">(bookingResult);
}

async function resolveExchangeRateForCurrency(currency: BookingInput["currency"]) {
  if (currency === "USD") {
    return 1;
  }

  const latestRate = await getLatestUsdToUzsRate();

  if (!latestRate?.rate) {
    throw new Error(
      "Нет актуального курса USD -> UZS. Добавьте запись в таблицу exchange_rates."
    );
  }

  return latestRate.rate;
}

async function assertBookingConflictFree(
  input: BookingInput,
  bookingIdToExclude?: string
) {
  const supabase = await createClient();

  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("id")
    .eq("id", input.apartment_id)
    .maybeSingle();

  if (apartmentError) {
    throw new Error(`Не удалось проверить квартиру: ${apartmentError.message}`);
  }

  if (!apartment) {
    throw new Error("Выберите корректную квартиру для этой брони.");
  }

  const { data: existingBookingsResult, error } = await supabase
    .from("bookings")
    .select("id, guest_name, check_in, check_out, booking_status")
    .eq("apartment_id", input.apartment_id)
    .neq("booking_status", "cancelled")
    .lt("check_in", input.check_out)
    .gt("check_out", input.check_in);

  if (error) {
    throw new Error(`Не удалось проверить конфликт брони: ${error.message}`);
  }

  const existingBookings: BookingConflictCandidate[] = existingBookingsResult ?? [];

  const conflict = findBookingConflict(
    {
      apartmentId: input.apartment_id,
      checkIn: input.check_in,
      checkOut: input.check_out,
      bookingStatus: input.booking_status,
      bookingIdToExclude
    },
    existingBookings
  );

  if (conflict) {
    throw new BookingConflictError(conflict);
  }
}

export async function createBooking(input: BookingInput): Promise<BookingRow> {
  const validatedInput: BookingInput = bookingSchema.parse(input);
  await assertBookingConflictFree(validatedInput);
  const exchangeRateUsed = await resolveExchangeRateForCurrency(
    validatedInput.currency
  );
  const totalAmountUsd = normalizeToUsd(
    validatedInput.total_amount_original,
    validatedInput.currency,
    exchangeRateUsed
  );
  const payload: BookingInsert = {
    apartment_id: validatedInput.apartment_id,
    guest_name: validatedInput.guest_name,
    guest_phone: validatedInput.guest_phone,
    check_in: validatedInput.check_in,
    check_out: validatedInput.check_out,
    prepaid_amount: validatedInput.prepaid_amount,
    payment_status: validatedInput.payment_status,
    booking_status: validatedInput.booking_status,
    notes: validatedInput.notes,
    currency: validatedInput.currency,
    total_amount_original: validatedInput.total_amount_original,
    total_amount_usd: totalAmountUsd,
    total_amount: totalAmountUsd,
    exchange_rate_used: exchangeRateUsed
  };
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .insert(toSupabaseInsert<"bookings">(payload))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Не удалось создать бронь: ${error.message}`);
  }

  return toTableRow<"bookings">(bookingResult);
}

export async function updateBooking(
  id: string,
  input: BookingUpdateInput
): Promise<BookingRow> {
  const existingBooking = await getBookingById(id);

  if (!existingBooking) {
    throw new Error("Бронь не найдена.");
  }

  const validatedInput: BookingInput = bookingSchema.parse({
    ...existingBooking,
    ...input
  });
  await assertBookingConflictFree(validatedInput, id);
  const exchangeRateUsed = await resolveExchangeRateForCurrency(
    validatedInput.currency
  );
  const totalAmountUsd = normalizeToUsd(
    validatedInput.total_amount_original,
    validatedInput.currency,
    exchangeRateUsed
  );
  const payload: BookingUpdate = {
    apartment_id: validatedInput.apartment_id,
    guest_name: validatedInput.guest_name,
    guest_phone: validatedInput.guest_phone,
    check_in: validatedInput.check_in,
    check_out: validatedInput.check_out,
    prepaid_amount: validatedInput.prepaid_amount,
    payment_status: validatedInput.payment_status,
    booking_status: validatedInput.booking_status,
    notes: validatedInput.notes,
    currency: validatedInput.currency,
    total_amount_original: validatedInput.total_amount_original,
    total_amount_usd: totalAmountUsd,
    total_amount: totalAmountUsd,
    exchange_rate_used: exchangeRateUsed
  };
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update(toSupabaseUpdate<"bookings">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Не удалось обновить бронь: ${error.message}`);
  }

  return toTableRow<"bookings">(bookingResult);
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw new Error(`Не удалось удалить бронь: ${error.message}`);
  }
}

export async function cancelBooking(id: string): Promise<BookingRow> {
  const supabase = await createClient();
  const payload: BookingUpdate = {
    booking_status: "cancelled"
  };
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update(toSupabaseUpdate<"bookings">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Не удалось отменить бронь: ${error.message}`);
  }

  return toTableRow<"bookings">(bookingResult);
}

export async function checkInBooking(id: string): Promise<BookingRow> {
  const payload: BookingUpdate = {
    booking_status: "checked_in"
  };
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update(toSupabaseUpdate<"bookings">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Не удалось отметить заезд: ${error.message}`);
  }

  return toTableRow<"bookings">(bookingResult);
}

export async function checkOutBooking(id: string): Promise<BookingRow> {
  const payload: BookingUpdate = {
    booking_status: "checked_out"
  };
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update(toSupabaseUpdate<"bookings">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Не удалось отметить выезд: ${error.message}`);
  }

  return toTableRow<"bookings">(bookingResult);
}
