import Link from "next/link";
import {
  ArrowRightLeft,
  CalendarArrowDown,
  CalendarArrowUp,
  DoorOpen,
  Wallet
} from "lucide-react";

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
import { getDashboardMetrics } from "@/lib/business/metrics";
import { listApartments } from "@/lib/data/apartments";
import { getSettings, type SettingsRow } from "@/lib/data/settings";
import { formatCurrency } from "@/lib/formatters";

export default async function DashboardPage() {
  const [metrics, apartments, settings] = await Promise.all([
    getDashboardMetrics(),
    listApartments({ status: "all" }),
    getSettings().catch((): SettingsRow | null => null)
  ]);

  const currency = settings?.currency ?? "USD";
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartment.id, apartment.title] as const)
  );

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="dashboard-summary-refresh"
        tables={["apartments", "bookings", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow="Operations overview"
        title="Apartment portfolio at a glance"
        description="Monitor occupancy, turnover, monthly performance, and the most recent reservation activity in one place."
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/expenses/new">Add expense</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/bookings/new">Add booking</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard
          label="Occupied today"
          value={String(metrics.occupiedToday)}
          description="Apartments currently blocked by an active booking today."
          icon={DoorOpen}
        />
        <StatCard
          label="Free today"
          value={String(metrics.freeToday)}
          description="Active apartments with no booking occupying today."
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Upcoming check-ins"
          value={String(metrics.upcomingCheckIns)}
          description="Scheduled check-ins over the next 7 days."
          icon={CalendarArrowDown}
        />
        <StatCard
          label="Upcoming check-outs"
          value={String(metrics.upcomingCheckOuts)}
          description="Scheduled check-outs over the next 7 days."
          icon={CalendarArrowUp}
        />
        <StatCard
          label="Monthly revenue"
          value={formatCurrency(metrics.monthlyRevenue, currency)}
          description="Qualified booking value starting this month."
          icon={Wallet}
        />
        <StatCard
          label="Monthly expenses"
          value={formatCurrency(metrics.monthlyExpenses, currency)}
          description="Expenses recorded during the current month."
          icon={Wallet}
        />
        <StatCard
          label="Monthly profit"
          value={formatCurrency(metrics.monthlyProfit, currency)}
          description="Revenue minus expenses for the current month."
          icon={Wallet}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Recent bookings"
          description="The latest reservation activity, including status and payment visibility."
        >
          <div className="flex flex-col gap-3">
            {metrics.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No bookings have been created yet.
              </p>
            ) : (
              metrics.recentBookings.map((booking) => (
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
                        {apartmentMap.get(booking.apartment_id) ?? "Unknown apartment"}
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
          title="Revenue trend"
          description="A lightweight 6-month view of qualified booking revenue."
        >
          <RevenueTrendChart data={metrics.revenueTrend} currency={currency} />
        </SectionCard>
      </section>

      <SectionCard
        title="Apartment performance summary"
        description="A simple operational breakdown showing which apartments are contributing the most right now."
      >
        {metrics.apartmentPerformance.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No apartments are ready for performance tracking"
            description="Add an apartment to start seeing revenue, expense, and profit summaries here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr] gap-4 bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Apartment</span>
              <span>Bookings</span>
              <span>Revenue</span>
              <span>Expenses</span>
              <span>Profit</span>
            </div>
            <div className="divide-y divide-border">
              {metrics.apartmentPerformance.map((item) => (
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
                    {formatCurrency(item.revenue, currency)}
                  </p>
                  <p className="text-sm text-foreground">
                    {formatCurrency(item.expenses, currency)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.profit, currency)}
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
