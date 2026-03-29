import Link from "next/link";
import {
  ArrowRightLeft,
  CalendarArrowDown,
  CalendarArrowUp,
  DoorOpen,
  Wallet
} from "lucide-react";

import { BookingActionForms } from "@/components/bookings/booking-action-forms";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  EMPTY_DASHBOARD_METRICS,
  getDashboardMetrics,
  type DashboardMetrics
} from "@/lib/business/metrics";
import { canCheckInBooking, canCheckOutBooking } from "@/lib/business/rules";
import { formatUsdAmount } from "@/lib/formatters";
import { getMessages } from "@/lib/i18n/messages";
import { listApartments } from "@/lib/data/apartments";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { getAppPreferences } from "@/lib/preferences";
import { toIsoDate } from "@/lib/dates";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type RecentBooking = DashboardMetrics["recentBookings"][number];
type ApartmentPerformanceRow = DashboardMetrics["apartmentPerformance"][number];

export default async function DashboardPage() {
  const [metricsResult, apartmentsResult, preferences, rateSnapshot] = await Promise.all([
    getDashboardMetrics().catch((): DashboardMetrics => EMPTY_DASHBOARD_METRICS),
    listApartments({ status: "all" }).catch((): ApartmentRow[] => []),
    getAppPreferences(),
    getLatestUsdToUzsRate().catch(() => null)
  ]);
  const metrics: DashboardMetrics = metricsResult;
  const apartments: ApartmentRow[] = apartmentsResult;
  const recentBookings: DashboardMetrics["recentBookings"] = metrics.recentBookings;
  const apartmentPerformance: DashboardMetrics["apartmentPerformance"] =
    metrics.apartmentPerformance;
  const revenueTrend: DashboardMetrics["revenueTrend"] = metrics.revenueTrend;
  const todayOperations: DashboardMetrics["todayOperations"] = metrics.todayOperations;
  const locale = preferences.locale;
  const displayCurrency = preferences.displayCurrency;
  const messages = getMessages(locale);
  const todayIso = toIsoDate(new Date());

  const apartmentMap = new Map(
    apartments.map((apartment: ApartmentRow) => [apartment.id, apartment.title] as const)
  );

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="dashboard-summary-refresh"
        tables={["apartments", "bookings", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow={messages.dashboard.eyebrow}
        title={messages.dashboard.title}
        description={messages.dashboard.description}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/expenses/new">{messages.dashboard.addExpense}</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/bookings/new">{messages.dashboard.addBooking}</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard
          label={messages.dashboard.occupiedToday}
          value={String(metrics.occupiedToday)}
          description={messages.dashboard.occupiedTodayDesc}
          icon={DoorOpen}
        />
        <StatCard
          label={messages.dashboard.freeToday}
          value={String(metrics.freeToday)}
          description={messages.dashboard.freeTodayDesc}
          icon={ArrowRightLeft}
        />
        <StatCard
          label={messages.dashboard.upcomingCheckIns}
          value={String(metrics.upcomingCheckIns)}
          description={messages.dashboard.upcomingCheckInsDesc}
          icon={CalendarArrowDown}
        />
        <StatCard
          label={messages.dashboard.upcomingCheckOuts}
          value={String(metrics.upcomingCheckOuts)}
          description={messages.dashboard.upcomingCheckOutsDesc}
          icon={CalendarArrowUp}
        />
        <StatCard
          label={messages.dashboard.monthlyRevenue}
          value={formatUsdAmount(metrics.monthlyRevenue, displayCurrency, locale, rateSnapshot)}
          description={messages.dashboard.monthlyRevenueDesc}
          icon={Wallet}
        />
        <StatCard
          label={messages.dashboard.monthlyExpenses}
          value={formatUsdAmount(metrics.monthlyExpenses, displayCurrency, locale, rateSnapshot)}
          description={messages.dashboard.monthlyExpensesDesc}
          icon={Wallet}
        />
        <StatCard
          label={messages.dashboard.monthlyProfit}
          value={formatUsdAmount(metrics.monthlyProfit, displayCurrency, locale, rateSnapshot)}
          description={messages.dashboard.monthlyProfitDesc}
          icon={Wallet}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title={messages.dashboard.todayActions}
          description={messages.dashboard.todayActionsDesc}
        >
          <div className="flex flex-col gap-3">
            {todayOperations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {messages.dashboard.todayEmptyDescription}
              </p>
            ) : (
              todayOperations.map((booking: RecentBooking) => (
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
                        {apartmentMap.get(booking.apartment_id) ?? messages.app.noData}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={booking.booking_status} locale={locale} />
                      <PaymentStatusBadge status={booking.payment_status} locale={locale} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <BookingActionForms
                      bookingId={booking.id}
                      returnTo="/dashboard"
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
          title={messages.dashboard.revenueTrend}
          description={messages.dashboard.revenueTrendDesc}
        >
          <RevenueTrendChart
            data={revenueTrend}
            currency={displayCurrency}
            locale={locale}
          />
        </SectionCard>
      </section>

      <SectionCard
        title={messages.dashboard.recentBookings}
        description={messages.dashboard.recentBookingsDesc}
      >
        <div className="flex flex-col gap-3">
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {messages.dashboard.noRecentBookings}
            </p>
          ) : (
            recentBookings.map((booking: RecentBooking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}/edit?returnTo=/dashboard`}
                className="rounded-2xl border border-border bg-surface-muted p-4 transition-colors hover:bg-white"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      {booking.guest_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apartmentMap.get(booking.apartment_id) ?? messages.app.noData}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BookingStatusBadge status={booking.booking_status} locale={locale} />
                    <PaymentStatusBadge status={booking.payment_status} locale={locale} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={messages.dashboard.apartmentPerformance}
        description={messages.dashboard.apartmentPerformanceDesc}
      >
        {apartmentPerformance.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={messages.dashboard.noApartmentsTitle}
            description={messages.dashboard.noApartmentsDescription}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr] gap-4 bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>{messages.expenses.apartment}</span>
              <span>{messages.apartments.bookings}</span>
              <span>{messages.reports.revenue}</span>
              <span>{messages.reports.expenses}</span>
              <span>{messages.reports.profit}</span>
            </div>
            <div className="divide-y divide-border">
              {apartmentPerformance.map((item: ApartmentPerformanceRow) => (
                <Link
                  key={item.apartmentId}
                  href={`/apartments/${item.apartmentId}`}
                  className="grid gap-3 bg-white px-4 py-4 transition-colors hover:bg-surface-muted md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr] md:items-center"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {item.apartmentTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.bookingsCount}</p>
                  <p className="text-sm text-foreground">
                    {formatUsdAmount(item.revenue, displayCurrency, locale, rateSnapshot)}
                  </p>
                  <p className="text-sm text-foreground">
                    {formatUsdAmount(item.expenses, displayCurrency, locale, rateSnapshot)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUsdAmount(item.profit, displayCurrency, locale, rateSnapshot)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
