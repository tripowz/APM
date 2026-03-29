import {
  checkInBookingAction,
  checkOutBookingAction,
} from "@/app/(app)/bookings/actions";
import { Button } from "@/components/ui/button";

type BookingActionFormsProps = {
  bookingId: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  returnTo: string;
  checkInLabel: string;
  checkOutLabel: string;
};

export function BookingActionForms({
  bookingId,
  canCheckIn,
  canCheckOut,
  returnTo,
  checkInLabel,
  checkOutLabel,
}: BookingActionFormsProps) {
  if (!canCheckIn && !canCheckOut) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {canCheckIn ? (
        <form action={checkInBookingAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" className="w-full sm:w-auto">
            {checkInLabel}
          </Button>
        </form>
      ) : null}

      {canCheckOut ? (
        <form action={checkOutBookingAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit" className="w-full sm:w-auto">
            {checkOutLabel}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

