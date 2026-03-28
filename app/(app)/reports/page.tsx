import Link from "next/link";
import { BarChart3, ReceiptText } from "lucide-react";

import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getReportMetrics,
  type ReportMetrics
} from "@/lib/business/metrics";
import { listApartments } from "@/lib/data/apartments";
import { getSettings, type SettingsRow } from "@/lib/data/settings";
import { getMonthStart, formatShortDate, toIsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type BookingStatus =
  | "new"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "all";

type ReportsPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    apartmentId?: string;
    bookingStatus?: BookingStatus;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const filters = {
    from: params?.from ?? toIsoDate(getMonthStart()),
    to: params?.to ?? toIsoDate(new Date()),
    apartmentId: params?.apartmentId ?? "",
    bookingStatus: params?.bookingStatus ?? "all"
  } as const;

  const [reportResult, apartmentsResult, settings] = await Promise.all([
    getReportMetrics({
      from: filters.from,
      to: filters.to,
      apartmentId: filters.apartmentId || undefined,
      bookingStatus: filters.bookingStatus
    }),
    listApartments({ status: "all" }),
    getSettings().catch((): SettingsRow | null => null)
  ]);
  const report: ReportMetrics = reportResult;
  const apartments: ApartmentRow[] = apartmentsResult;

  const currency = settings?.currency ?? "USD";
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartment.id, apartment.title] as const)
  );
  const hasResults =
    report.bookings.length > 0 ||
    report.expensesRows.length > 0 ||
    report.revenue > 0 ||
    report.expenses > 0;

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="reports-refresh"
        tables={["apartments", "bookings", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow="Reports"
        title="Practical revenue and operations reports"
        description="Revenue counts full booking value when a booking starts inside the selected period and is in a revenue status. Expenses use expense date, and profit is revenue minus expenses."
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

      <SectionCard
        title="Filters"
        description="Keep the reporting logic simple by choosing a date range, optional apartment, and booking status filter."
        actions={
          <StatusBadge tone="info">
            {report.bookingsCount} bookings in range
          </StatusBadge>
        }
      >
        <form className="grid gap-4 xl:grid-cols-[160px_160px_240px_220px_auto]">
          <Input type="date" name="from" defaultValue={filters.from} />
          <Input type="date" name="to" defaultValue={filters.to} />
          <Select name="apartmentId" defaultValue={filters.apartmentId}>
            <option value="">All apartments</option>
            {apartments.map((apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <Select name="bookingStatus" defaultValue={filters.bookingStatus}>
            <option value="all">All booking statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="checked_out">Checked out</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </form>
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Revenue"
          value={formatCurrency(report.revenue, currency)}
          description="Bookings in a revenue status whose check-in date falls in the selected period."
          icon={BarChart3}
        />
        <StatCard
          label="Expenses"
          value={formatCurrency(report.expenses, currency)}
          description="Expense entries whose expense date falls in the selected period."
          icon={ReceiptText}
        />
        <StatCard
          label="Profit"
          value={formatCurrency(report.profit, currency)}
          description="Revenue minus expenses for the current report filter."
          icon={BarChart3}
        />
        <StatCard
          label="Bookings count"
          value={String(report.bookingsCount)}
          description="Non-cancelled bookings with check-in dates inside the selected period."
          icon={BarChart3}
        />
        <StatCard
          label="Avg. booking value"
          value={formatCurrency(report.averageBookingValue, currency)}
          description="Average value across revenue-eligible bookings in the selected period."
          icon={BarChart3}
        />
        <StatCard
          label="Occupancy snapshot"
          value={`${Math.round(report.occupancySnapshot.occupancyRate * 100)}%`}
          description="Blocked apartment-days divided by available active apartment-days in the selected range."
          icon={BarChart3}
        />
      </section>

      {!hasResults ? (
        <SectionCard
          title="No report data yet"
          description="Once bookings and expenses land in the selected period, they will appear here."
        >
          <EmptyState
            icon={BarChart3}
            title="No report data matches the current filters"
            description="Try a wider date range, remove apartment filtering, or start by creating a booking or expense."
          />
        </SectionCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Apartment breakdown"
          description="A straightforward apartment-by-apartment summary for the selected report window."
        >
          {report.apartmentBreakdown.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No apartments available for reporting"
              description="Create an apartment first, then bookings and expenses will roll into this report automatically."
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
                {report.apartmentBreakdown.map((item) => (
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

        <SectionCard
          title="Occupancy snapshot"
          description="This uses booking date overlap, not booking value, so occupancy stays understandable."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Occupied apartment-days
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {report.occupancySnapshot.occupiedApartmentDays}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Available apartment-days
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {report.occupancySnapshot.availableApartmentDays}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Occupancy rate
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {Math.round(report.occupancySnapshot.occupancyRate * 100)}%
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Bookings in report period"
          description="These bookings are grouped into the report by check-in date."
        >
          {report.bookings.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No bookings in this report period"
              description="Bookings will appear here once their check-in date falls inside the selected range."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {report.bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}/edit?returnTo=/reports`}
                  className="rounded-2xl border border-border bg-surface-muted p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {formatShortDate(booking.check_in)} to{" "}
                        {formatShortDate(booking.check_out)}
                      </span>
                      <span>{formatCurrency(Number(booking.total_amount), currency)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Expenses in report period"
          description="Expenses are grouped by expense date and remain independent from booking status."
        >
          {report.expensesRows.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No expenses in this report period"
              description="Expenses will appear here once an expense date falls inside the selected range."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {report.expensesRows.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}/edit?returnTo=/reports`}
                  className="rounded-2xl border border-border bg-surface-muted p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {apartmentMap.get(expense.apartment_id) ?? "Unknown apartment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expense.note || "No note added"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge tone="neutral" className="capitalize">
                        {expense.category}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {formatShortDate(expense.expense_date)}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(Number(expense.amount), currency)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
