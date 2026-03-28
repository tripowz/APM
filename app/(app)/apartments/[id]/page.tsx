import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getApartmentDetails } from "@/lib/data/apartments";
import { getSettings, type SettingsRow } from "@/lib/data/settings";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentDetails = {
  apartment: Database["public"]["Tables"]["apartments"]["Row"];
  bookings: Database["public"]["Tables"]["bookings"]["Row"][];
  expenses: Database["public"]["Tables"]["expenses"]["Row"][];
  stats: {
    bookingsCount: number;
    revenue: number;
    expenses: number;
    profit: number;
  };
};

type ApartmentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApartmentDetailsPage({
  params
}: ApartmentDetailsPageProps) {
  const { id } = await params;
  const [detailsResult, settings] = await Promise.all([
    getApartmentDetails(id),
    getSettings().catch((): SettingsRow | null => null)
  ]);

  if (!detailsResult) {
    notFound();
  }

  const details: ApartmentDetails = detailsResult;
  const apartmentBookings: ApartmentDetails["bookings"] = details.bookings;
  const apartmentExpenses: ApartmentDetails["expenses"] = details.expenses;

  const currency = settings?.currency ?? "USD";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Apartments"
        title={details.apartment.title}
        description={details.apartment.address}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href={`/apartments/${details.apartment.id}/edit`}>Edit apartment</Link>
            </Button>
            <Button asChild size="lg">
              <Link
                href={`/bookings/new?apartmentId=${details.apartment.id}&returnTo=/apartments/${details.apartment.id}`}
              >
                Add booking
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">Bookings count</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {details.stats.bookingsCount}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(details.stats.revenue, currency)}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">Expenses</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(details.stats.expenses, currency)}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">Profit</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(details.stats.profit, currency)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Bookings"
          description="Current and past bookings for this apartment."
          actions={
            <StatusBadge
              tone={details.apartment.status === "active" ? "success" : "neutral"}
            >
              {details.apartment.status}
            </StatusBadge>
          }
        >
          <div className="flex flex-col gap-3">
            {apartmentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings yet for this apartment.
              </p>
            ) : (
              apartmentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}/edit?returnTo=/apartments/${details.apartment.id}`}
                  className="rounded-2xl border border-border bg-surface-muted p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {booking.guest_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(booking.check_in)} to{" "}
                        {formatShortDate(booking.check_out)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={booking.booking_status} />
                      <PaymentStatusBadge status={booking.payment_status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Apartment notes and expenses"
          description="Operational context and recent apartment-related costs."
        >
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <p className="text-sm font-semibold text-foreground">Notes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {details.apartment.notes || "No notes added yet."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {apartmentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No expenses recorded for this apartment yet.
                </p>
              ) : (
                apartmentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-border bg-surface-muted p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold capitalize text-foreground">
                          {expense.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatShortDate(expense.expense_date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(Number(expense.amount), currency)}
                      </p>
                    </div>
                    {expense.note ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {expense.note}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
