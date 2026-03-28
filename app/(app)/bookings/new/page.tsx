import Link from "next/link";

import { BookingForm } from "@/components/bookings/booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";

type NewBookingPageProps = {
  searchParams?: Promise<{
    apartmentId?: string;
    returnTo?: string;
  }>;
};

export default async function NewBookingPage({
  searchParams
}: NewBookingPageProps) {
  const params = await searchParams;
  const apartments = await listApartments({ status: "all" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Bookings"
        title="Create booking"
        description="Add a booking, capture payment status, and validate conflicts before saving."
        actions={
          params?.returnTo ? (
            <Button asChild variant="outline" size="lg">
              <Link href={params.returnTo}>Back</Link>
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Booking details"
        description="Cancelled bookings do not block dates. All other booking statuses run through conflict validation on the server."
      >
        <BookingForm
          apartments={apartments}
          defaultApartmentId={params?.apartmentId}
          returnTo={params?.returnTo}
        />
      </SectionCard>
    </div>
  );
}
