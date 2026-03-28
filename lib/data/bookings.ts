import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { BookingConflictError, findBookingConflict } from "@/lib/bookings/conflicts";
import {
  bookingSchema,
  type BookingInput,
  type BookingUpdateInput
} from "@/lib/validations/booking";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
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
    throw new Error(`Failed to load bookings: ${error.message}`);
  }

  const bookings: BookingRow[] = bookingsResult ?? [];

  return bookings;
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load booking: ${error.message}`);
  }

  return bookingResult;
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
    throw new Error(`Failed to validate apartment: ${apartmentError.message}`);
  }

  if (!apartment) {
    throw new Error("Select a valid apartment for this booking.");
  }

  const { data: existingBookingsResult, error } = await supabase
    .from("bookings")
    .select("id, guest_name, check_in, check_out, booking_status")
    .eq("apartment_id", input.apartment_id)
    .neq("booking_status", "cancelled")
    .lt("check_in", input.check_out)
    .gt("check_out", input.check_in);

  if (error) {
    throw new Error(`Failed to validate booking conflict: ${error.message}`);
  }

  const existingBookings: BookingConflictCandidate[] =
    existingBookingsResult ?? [];

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
  const payload = bookingSchema.parse(input);
  await assertBookingConflictFree(payload);
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return bookingResult;
}

export async function updateBooking(
  id: string,
  input: BookingUpdateInput
): Promise<BookingRow> {
  const existingBooking = await getBookingById(id);

  if (!existingBooking) {
    throw new Error("Booking not found.");
  }

  const payload = bookingSchema.parse({
    ...existingBooking,
    ...input
  });

  await assertBookingConflictFree(payload, id);
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }

  return bookingResult;
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete booking: ${error.message}`);
  }
}

export async function cancelBooking(id: string): Promise<BookingRow> {
  const supabase = await createClient();
  const { data: bookingResult, error } = await supabase
    .from("bookings")
    .update({
      booking_status: "cancelled"
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }

  return bookingResult;
}
