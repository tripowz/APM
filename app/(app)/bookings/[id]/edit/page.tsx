import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelBookingAction,
  deleteBookingAction
} from "@/app/(app)/bookings/actions";
import { BookingActionForms } from "@/components/bookings/booking-action-forms";
import { BookingForm } from "@/components/bookings/booking-form";
import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { canCheckInBooking, canCheckOutBooking } from "@/lib/business/rules";
import { listApartments } from "@/lib/data/apartments";
import { getBookingById } from "@/lib/data/bookings";
import { formatShortDate, toIsoDate } from "@/lib/dates";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import type { Database } from "@/lib/supabase/database.types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type EditBookingPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function EditBookingPage({
  params,
  searchParams
}: EditBookingPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [{ locale }, bookingResult, apartmentsResult] = await Promise.all([
    getAppPreferences(),
    getBookingById(id),
    listApartments({ status: "all" })
  ]);
  const messages = getMessages(locale);

  if (!bookingResult) {
    return notFound();
  }

  const booking: BookingRow = bookingResult;
  const apartments: ApartmentRow[] = apartmentsResult;
  const apartmentMap = new Map(
    apartments.map((apartment: ApartmentRow) => [apartment.id, apartment.title] as const)
  );

  const apartmentTitle = apartmentMap.get(booking.apartment_id) ?? null;
  const returnTo =
    resolvedSearchParams?.returnTo ?? `/apartments/${booking.apartment_id}`;
  const todayIso = toIsoDate(new Date());
  const showCheckIn = canCheckInBooking(booking.booking_status, booking.check_in, todayIso);
  const showCheckOut = canCheckOutBooking(
    booking.booking_status,
    booking.check_out,
    todayIso
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.bookings.eyebrow}
        title={booking.guest_name}
        description={`${formatShortDate(booking.check_in, locale)} - ${formatShortDate(
          booking.check_out,
          locale
        )}`}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={returnTo}>{messages.app.back}</Link>
          </Button>
        }
      />

      <SectionCard
        title={messages.bookings.editTitle}
        description={
          apartmentTitle ? `${messages.bookings.apartment}: ${apartmentTitle}` : messages.bookings.editTitle
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.booking_status} locale={locale} />
            <PaymentStatusBadge status={booking.payment_status} locale={locale} />
          </div>
        }
      >
        <BookingForm
          booking={booking}
          apartments={apartments}
          returnTo={returnTo}
          locale={locale}
        />
      </SectionCard>

      <SectionCard
        title={messages.bookings.todayActionTitle}
        description={messages.bookings.todayActionDescription}
      >
        {showCheckIn || showCheckOut ? (
          <BookingActionForms
            bookingId={booking.id}
            returnTo={returnTo}
            canCheckIn={showCheckIn}
            canCheckOut={showCheckOut}
            checkInLabel={messages.dashboard.checkIn}
            checkOutLabel={messages.dashboard.checkOut}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {messages.dashboard.todayEmptyDescription}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={messages.bookings.dangerTitle}
        description={messages.bookings.dangerDescription}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <form action={cancelBookingAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button
              type="submit"
              variant="outline"
              className="w-full border-warning/30 text-warning hover:bg-warning/5 sm:w-auto"
            >
              {messages.bookings.cancelBooking}
            </Button>
          </form>

          <form action={deleteBookingAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button
              type="submit"
              variant="outline"
              className="w-full border-danger/30 text-danger hover:bg-danger/5 sm:w-auto"
            >
              {messages.bookings.deleteBooking}
            </Button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
