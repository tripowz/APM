import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MonthCalendar } from "@/components/calendar/month-calendar";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { addMonths, formatMonthLabel, getMonthKey, getMonthStart } from "@/lib/dates";
import { listApartments } from "@/lib/data/apartments";
import { listBookings } from "@/lib/data/bookings";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type CalendarBooking = BookingRow & {
  apartment_title: string;
};

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    apartmentId?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const monthStart = getMonthStart(params?.month);
  const monthKey = getMonthKey(monthStart);
  const apartmentId = params?.apartmentId;

  const [apartmentsResult, bookingsResult] = await Promise.all([
    listApartments({ status: "all" }),
    listBookings({
      apartmentId,
      month: monthKey
    })
  ]);
  const apartments: ApartmentRow[] = apartmentsResult;
  const bookings: BookingRow[] = bookingsResult;

  const apartmentMap = new Map(
    apartments.map((apartment: ApartmentRow) => [apartment.id, apartment.title] as const)
  );
  const enrichedBookings: CalendarBooking[] = bookings.map((booking: BookingRow) => ({
    ...booking,
    apartment_title: apartmentMap.get(booking.apartment_id) ?? "Unknown apartment"
  }));
  const previousMonth = getMonthKey(addMonths(monthStart, -1));
  const nextMonth = getMonthKey(addMonths(monthStart, 1));

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="calendar-refresh"
        tables={["apartments", "bookings"]}
      />

      <PageHeader
        eyebrow="Calendar"
        title="Reservation and turnover calendar"
        description="Use the month view on desktop and the agenda list on mobile to manage apartment occupancy without extra complexity."
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link
              href={`/bookings/new?${new URLSearchParams({
                apartmentId: apartmentId ?? "",
                returnTo: `/calendar?month=${monthKey}${apartmentId ? `&apartmentId=${apartmentId}` : ""}`
              }).toString()}`}
            >
              Add booking
            </Link>
          </Button>
        }
      />

      <SectionCard
        title="Calendar controls"
        description="Switch months, filter by apartment, and jump directly into booking creation."
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/calendar?month=${previousMonth}${apartmentId ? `&apartmentId=${apartmentId}` : ""}`}
              >
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                {formatMonthLabel(monthStart)}
              </p>
            </div>
            <Button asChild variant="outline" size="icon">
              <Link
                href={`/calendar?month=${nextMonth}${apartmentId ? `&apartmentId=${apartmentId}` : ""}`}
              >
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          <form className="grid gap-3 sm:grid-cols-[240px_auto]">
            <input type="hidden" name="month" value={monthKey} />
            <Select name="apartmentId" defaultValue={apartmentId ?? ""}>
              <option value="">All apartments</option>
              {apartments.map((apartment: ApartmentRow) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.title}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Apply filter
            </Button>
          </form>
        </div>
      </SectionCard>

      <SectionCard
        title="Calendar canvas"
        description="Bookings render across the month grid on desktop and as a simpler agenda on mobile."
      >
        <MonthCalendar
          monthStart={monthStart}
          bookings={enrichedBookings}
          apartmentId={apartmentId}
        />
      </SectionCard>
    </div>
  );
}
