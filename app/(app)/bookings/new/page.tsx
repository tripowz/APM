import Link from "next/link";

import { BookingForm } from "@/components/bookings/booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";

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
  const [{ locale }, apartments] = await Promise.all([
    getAppPreferences(),
    listApartments({ status: "all" })
  ]);
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.bookings.eyebrow}
        title={messages.dashboard.addBooking}
        description={messages.calendar.description}
        actions={
          params?.returnTo ? (
            <Button asChild variant="outline" size="lg">
              <Link href={params.returnTo}>{messages.app.back}</Link>
            </Button>
          ) : null
        }
      />

      <SectionCard
        title={messages.bookings.editTitle}
        description={messages.bookings.todayActionDescription}
      >
        <BookingForm
          apartments={apartments}
          defaultApartmentId={params?.apartmentId}
          returnTo={params?.returnTo}
          locale={locale}
        />
      </SectionCard>
    </div>
  );
}
