import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingActionForms } from "@/components/bookings/booking-action-forms";
import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { canCheckInBooking, canCheckOutBooking } from "@/lib/business/rules";
import { getApartmentDetails } from "@/lib/data/apartments";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { formatShortDate, toIsoDate } from "@/lib/dates";
import { formatUsdAmount } from "@/lib/formatters";
import { getExpenseCategoryLabel, getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
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
type ApartmentBooking = ApartmentDetails["bookings"][number];
type ApartmentExpense = ApartmentDetails["expenses"][number];

type ApartmentDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApartmentDetailsPage({
  params
}: ApartmentDetailsPageProps) {
  const { id } = await params;
  const [detailsResult, preferences, rateSnapshot] = await Promise.all([
    getApartmentDetails(id),
    getAppPreferences(),
    getLatestUsdToUzsRate().catch(() => null)
  ]);

  if (!detailsResult) {
    return notFound();
  }

  const details: ApartmentDetails = detailsResult;
  const apartmentBookings: ApartmentDetails["bookings"] = details.bookings;
  const apartmentExpenses: ApartmentDetails["expenses"] = details.expenses;
  const locale = preferences.locale;
  const displayCurrency = preferences.displayCurrency;
  const messages = getMessages(locale);
  const todayIso = toIsoDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.apartments.eyebrow}
        title={details.apartment.title}
        description={details.apartment.address}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href={`/apartments/${details.apartment.id}/edit`}>
                {messages.app.edit}
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link
                href={`/bookings/new?apartmentId=${details.apartment.id}&returnTo=/apartments/${details.apartment.id}`}
              >
                {messages.dashboard.addBooking}
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">{messages.apartments.bookings}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {details.stats.bookingsCount}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">{messages.apartments.revenue}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatUsdAmount(details.stats.revenue, displayCurrency, locale, rateSnapshot)}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">{messages.apartments.expenses}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatUsdAmount(details.stats.expenses, displayCurrency, locale, rateSnapshot)}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-muted-foreground">{messages.apartments.profit}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatUsdAmount(details.stats.profit, displayCurrency, locale, rateSnapshot)}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title={messages.apartments.bookings}
          description={messages.apartments.description}
          actions={
            <StatusBadge
              tone={details.apartment.status === "active" ? "success" : "neutral"}
            >
              {messages.statuses.apartmentStatus[details.apartment.status]}
            </StatusBadge>
          }
        >
          <div className="flex flex-col gap-3">
            {apartmentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {messages.dashboard.noRecentBookings}
              </p>
            ) : (
              apartmentBookings.map((booking: ApartmentBooking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-border bg-surface-muted p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {booking.guest_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(booking.check_in, locale)} -
                        {" "}
                        {formatShortDate(booking.check_out, locale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={booking.booking_status} locale={locale} />
                      <PaymentStatusBadge status={booking.payment_status} locale={locale} />
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/bookings/${booking.id}/edit?returnTo=/apartments/${details.apartment.id}`}
                        >
                          {messages.app.edit}
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <BookingActionForms
                      bookingId={booking.id}
                      returnTo={`/apartments/${details.apartment.id}`}
                      canCheckIn={canCheckInBooking(
                        booking.booking_status,
                        booking.check_in,
                        todayIso
                      )}
                      canCheckOut={canCheckOutBooking(
                        booking.booking_status,
                        booking.check_out,
                        todayIso
                      )}
                      checkInLabel={messages.dashboard.checkIn}
                      checkOutLabel={messages.dashboard.checkOut}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={messages.expenses.title}
          description={messages.expenses.description}
        >
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <p className="text-sm font-semibold text-foreground">
                {messages.apartments.form.notes}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {details.apartment.notes || messages.app.noData}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {apartmentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {messages.expenses.emptyDescription}
                </p>
              ) : (
                apartmentExpenses.map((expense: ApartmentExpense) => (
                  <div
                    key={expense.id}
                    className="rounded-2xl border border-border bg-surface-muted p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">
                          {getExpenseCategoryLabel(locale, expense.category)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatShortDate(expense.expense_date, locale)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatUsdAmount(
                          Number(expense.amount_usd ?? expense.amount),
                          displayCurrency,
                          locale,
                          rateSnapshot
                        )}
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
