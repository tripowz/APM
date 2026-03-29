import { dateRangesOverlap } from "@/lib/dates";

type ConflictCandidate = {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_status: "new" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
};

type ConflictInput = {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: "new" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  bookingIdToExclude?: string;
};

export class BookingConflictError extends Error {
  existingBooking: ConflictCandidate;

  constructor(existingBooking: ConflictCandidate) {
    super("Booking conflict detected.");
    this.name = "BookingConflictError";
    this.existingBooking = existingBooking;
  }
}

export function shouldCheckBookingConflicts(
  bookingStatus: ConflictInput["bookingStatus"]
) {
  return bookingStatus !== "cancelled";
}

export function findBookingConflict(
  input: ConflictInput,
  existingBookings: ConflictCandidate[]
) {
  if (!shouldCheckBookingConflicts(input.bookingStatus)) {
    return null;
  }

  return (
    existingBookings.find((booking) => {
      if (booking.id === input.bookingIdToExclude) {
        return false;
      }

      if (booking.booking_status === "cancelled") {
        return false;
      }

      return dateRangesOverlap(
        input.checkIn,
        input.checkOut,
        booking.check_in,
        booking.check_out
      );
    }) ?? null
  );
}
