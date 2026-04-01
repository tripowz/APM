export const revenueBookingStatuses = [
  "confirmed",
  "checked_in",
  "checked_out"
] as const;

export const blockingBookingStatuses = [
  "new",
  "confirmed",
  "checked_in",
  "checked_out"
] as const;

export function isRevenueBookingStatus(status: string) {
  return revenueBookingStatuses.includes(
    status as (typeof revenueBookingStatuses)[number]
  );
}

export function isBlockingBookingStatus(status: string) {
  return blockingBookingStatuses.includes(
    status as (typeof blockingBookingStatuses)[number]
  );
}

export function canCheckInBooking(status: string, checkIn: string, today: string) {
  return status === "confirmed" && checkIn <= today;
}

export function canCheckOutBooking(status: string, checkOut: string, today: string) {
  return status === "checked_in" && checkOut <= today;
}
