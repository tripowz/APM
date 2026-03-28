import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelBookingAction,
  deleteBookingAction
} from "@/app/(app)/bookings/actions";
import { BookingForm } from "@/components/bookings/booking-form";
import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";
import { getBookingById } from "@/lib/data/bookings";
import { formatShortDate } from "@/lib/dates";
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
  const [bookingResult, apartmentsResult] = await Promise.all([
    getBookingById(id),
    listApartments({ status: "all" })
  ]);

  if (!bookingResult) {
    notFound();
  }

  const booking: BookingRow = bookingResult;
  const apartments: ApartmentRow[] = apartmentsResult;
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartment.id, apartment.title] as const)
  );

  const apartmentTitle = apartmentMap.get(booking.apartment_id) ?? null;
  const returnTo =
    resolvedSearchParams?.returnTo ?? `/apartments/${booking.apartment_id}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Bookings"
        title={booking.guest_name}
        description={`${formatShortDate(booking.check_in)} to ${formatShortDate(booking.check_out)}`}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={returnTo}>Back</Link>
          </Button>
        }
      />

      <SectionCard
        title="Booking status"
        description={apartmentTitle ? `Apartment: ${apartmentTitle}` : "Booking details"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.booking_status} />
            <PaymentStatusBadge status={booking.payment_status} />
          </div>
        }
      >
        <BookingForm
          booking={booking}
          apartments={apartments}
          returnTo={returnTo}
        />
      </SectionCard>

      <SectionCard
        title="Danger zone"
        description="Use cancellation to keep the reservation history without blocking dates. Delete only when the booking should be removed entirely."
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
              Cancel booking
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
              Delete booking
            </Button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
