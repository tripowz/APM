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
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import {
  createEmptyReportMetrics,
  getReportMetrics,
  type ReportMetrics
} from "@/lib/business/metrics";
import { listApartments } from "@/lib/data/apartments";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { getBusinessTimeZone } from "@/lib/data/settings";
import {
  getCurrentDateInTimeZone,
  formatMonthLabel,
  formatShortDate,
  getMonthStart,
  getTodayIso,
  getValidIsoDate,
  parseIsoDate,
  toIsoDate
} from "@/lib/dates";
import { formatUsdAmount } from "@/lib/formatters";
import { getExpenseCategoryLabel, getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type ReportBooking = ReportMetrics["bookings"][number];
type ReportExpense = ReportMetrics["expensesRows"][number];
type ApartmentBreakdownRow = ReportMetrics["apartmentBreakdown"][number];

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
  const timeZone = await getBusinessTimeZone();
  const today = getCurrentDateInTimeZone(timeZone);
  const todayIso = getTodayIso(timeZone);
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const monthStart = getMonthStart(undefined, timeZone);
  const monthEnd = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)
  );
  const from = getValidIsoDate(params?.from) ?? toIsoDate(monthStart);
  const toCandidate = getValidIsoDate(params?.to) ?? todayIso;
  const filters = {
    from,
    to: toCandidate < from ? from : toCandidate,
    apartmentId: params?.apartmentId ?? "",
    bookingStatus: params?.bookingStatus ?? "all"
  } as const;

  const [reportResult, apartmentsResult, preferences, rateSnapshot] = await Promise.all([
    getReportMetrics({
      from: filters.from,
      to: filters.to,
      apartmentId: filters.apartmentId || undefined,
      bookingStatus: filters.bookingStatus
    }, timeZone).catch((): ReportMetrics =>
      createEmptyReportMetrics({
        from: filters.from,
        to: filters.to,
        apartmentId: filters.apartmentId || undefined,
        bookingStatus: filters.bookingStatus
      }, timeZone)
    ),
    listApartments({ status: "all" }).catch((): ApartmentRow[] => []),
    getAppPreferences(),
    getLatestUsdToUzsRate().catch(() => null)
  ]);
  const report: ReportMetrics = reportResult;
  const apartments: ApartmentRow[] = apartmentsResult;
  const apartmentBreakdown: ReportMetrics["apartmentBreakdown"] =
    report.apartmentBreakdown;
  const reportBookings: ReportMetrics["bookings"] = report.bookings;
  const reportExpensesRows: ReportMetrics["expensesRows"] = report.expensesRows;
  const locale = preferences.locale;
  const displayCurrency = preferences.displayCurrency;
  const messages = getMessages(locale);
  const buildRangeHref = (from: string, to: string) =>
    `/reports?${new URLSearchParams({
      from,
      to,
      apartmentId: filters.apartmentId,
      bookingStatus: filters.bookingStatus
    }).toString()}`;

  const formatTrendLabel = (label: string) => {
    if (/^\d{4}-\d{2}$/.test(label)) {
      return formatMonthLabel(parseIsoDate(`${label}-01`), locale);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      return formatShortDate(label, locale);
    }

    if (/^\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2}$/.test(label)) {
      const [from, to] = label.split(" - ");
      return `${formatShortDate(from, locale)} - ${formatShortDate(to, locale)}`;
    }

    return label;
  };

  const apartmentMap = new Map(
    apartments.map((apartment: ApartmentRow) => [apartment.id, apartment.title] as const)
  );
  const hasResults =
    reportBookings.length > 0 ||
    reportExpensesRows.length > 0 ||
    report.revenue > 0 ||
    report.expenses > 0;

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="reports-refresh"
        tables={["apartments", "bookings", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow={messages.reports.eyebrow}
        title={messages.reports.title}
        description={messages.reports.description}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/expenses/new">{messages.expenses.addExpense}</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/bookings/new">{messages.dashboard.addBooking}</Link>
            </Button>
          </div>
        }
      />

      <SectionCard
        title={messages.reports.filtersTitle}
        description={messages.reports.filtersDesc}
        actions={
          <StatusBadge tone="info">
            {report.bookingsCount} {messages.reports.bookingsCount.toLowerCase()}
          </StatusBadge>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={buildRangeHref(todayIso, todayIso)}>{messages.reports.today}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={buildRangeHref(toIsoDate(weekStart), toIsoDate(weekEnd))}>
              {messages.reports.week}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={buildRangeHref(toIsoDate(monthStart), toIsoDate(monthEnd))}>
              {messages.reports.month}
            </Link>
          </Button>
        </div>
        <form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[160px_160px_240px_220px_auto]">
          <DatePicker name="from" defaultValue={filters.from} locale={locale} />
          <DatePicker name="to" defaultValue={filters.to} locale={locale} />
          <Select name="apartmentId" defaultValue={filters.apartmentId}>
            <option value="">{messages.calendar.allApartments}</option>
            {apartments.map((apartment: ApartmentRow) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <Select name="bookingStatus" defaultValue={filters.bookingStatus}>
            <option value="all">{messages.bookings.bookingStatus}</option>
            <option value="new">{messages.statuses.booking.new}</option>
            <option value="confirmed">{messages.statuses.booking.confirmed}</option>
            <option value="checked_in">{messages.statuses.booking.checked_in}</option>
            <option value="checked_out">{messages.statuses.booking.checked_out}</option>
            <option value="cancelled">{messages.statuses.booking.cancelled}</option>
          </Select>
          <Button type="submit" variant="secondary" className="w-full sm:w-auto">
            {messages.app.apply}
          </Button>
        </form>
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard
          label={messages.reports.revenue}
          value={formatUsdAmount(report.revenue, displayCurrency, locale, rateSnapshot)}
          description={messages.reports.revenue}
          icon={BarChart3}
        />
        <StatCard
          label={messages.reports.expenses}
          value={formatUsdAmount(report.expenses, displayCurrency, locale, rateSnapshot)}
          description={messages.reports.expenses}
          icon={ReceiptText}
        />
        <StatCard
          label={messages.reports.profit}
          value={formatUsdAmount(report.profit, displayCurrency, locale, rateSnapshot)}
          description={messages.reports.profit}
          icon={BarChart3}
        />
        <StatCard
          label={messages.reports.bookingsCount}
          value={String(report.bookingsCount)}
          description={messages.reports.bookingsCount}
          icon={BarChart3}
        />
        <StatCard
          label={messages.reports.averageBookingValue}
          value={formatUsdAmount(
            report.averageBookingValue,
            displayCurrency,
            locale,
            rateSnapshot
          )}
          description={messages.reports.averageBookingValue}
          icon={BarChart3}
        />
        <StatCard
          label={messages.reports.averageRevenuePerNight}
          value={formatUsdAmount(
            report.averageRevenuePerNight,
            displayCurrency,
            locale,
            rateSnapshot
          )}
          description={messages.reports.averageRevenuePerNight}
          icon={BarChart3}
        />
        <StatCard
          label={messages.reports.occupancy}
          value={`${Math.round(report.occupancySnapshot.occupancyRate * 100)}%`}
          description={messages.reports.occupancy}
          icon={BarChart3}
        />
      </section>

      {!hasResults ? (
        <SectionCard
          title={messages.reports.noDataTitle}
          description={messages.reports.noDataDescription}
        >
          <EmptyState
            icon={BarChart3}
            title={messages.reports.noDataTitle}
            description={messages.reports.noDataDescription}
          />
        </SectionCard>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title={messages.reports.apartmentBreakdown}
          description={messages.reports.apartmentBreakdown}
        >
          {apartmentBreakdown.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={messages.apartments.noneTitle}
              description={messages.apartments.noneDescription}
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
                {apartmentBreakdown.map((item: ApartmentBreakdownRow) => (
                  <Link
                    key={item.apartmentId}
                    href={`/apartments/${item.apartmentId}`}
                    className="grid gap-3 bg-white px-4 py-4 transition-colors hover:bg-surface-muted md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr] md:items-center"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.apartmentTitle}
                    </p>
                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">
                        {messages.apartments.bookings}
                      </span>
                      <p className="text-sm text-muted-foreground">{item.bookingsCount}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">
                        {messages.reports.revenue}
                      </span>
                      <p className="text-sm text-foreground">
                        {formatUsdAmount(item.revenue, displayCurrency, locale, rateSnapshot)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">
                        {messages.reports.expenses}
                      </span>
                      <p className="text-sm text-foreground">
                        {formatUsdAmount(item.expenses, displayCurrency, locale, rateSnapshot)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:hidden">
                        {messages.reports.profit}
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatUsdAmount(item.profit, displayCurrency, locale, rateSnapshot)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={messages.reports.occupancy}
          description={messages.reports.occupancy}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {messages.reports.occupiedDays}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {report.occupancySnapshot.occupiedApartmentDays}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {messages.reports.availableDays}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {report.occupancySnapshot.availableApartmentDays}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {messages.reports.occupancyRate}
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
          title={messages.reports.categoryBreakdown}
          description={messages.reports.categoryBreakdown}
        >
          <div className="grid gap-3">
            {report.expenseCategoryBreakdown.map((item) => (
              <div
                key={item.category}
                className="surface-muted flex items-center justify-between p-4"
              >
                <span className="text-sm font-medium text-foreground">
                  {getExpenseCategoryLabel(locale, item.category)}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatUsdAmount(item.total, displayCurrency, locale, rateSnapshot)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={messages.reports.trend} description={messages.reports.trend}>
          <div className="grid gap-3">
            {report.trend.map((item) => (
              <div
                key={item.label}
                className="surface-muted grid gap-2 p-4 sm:grid-cols-4 sm:items-center"
              >
                <p className="text-sm font-semibold text-foreground">
                  {formatTrendLabel(item.label)}
                </p>
                <div className="flex items-center justify-between gap-3 sm:block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                    {messages.reports.revenue}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {formatUsdAmount(item.revenue, displayCurrency, locale, rateSnapshot)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                    {messages.reports.expenses}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {formatUsdAmount(item.expenses, displayCurrency, locale, rateSnapshot)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:hidden">
                    {messages.reports.profit}
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {formatUsdAmount(item.profit, displayCurrency, locale, rateSnapshot)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title={messages.reports.bookingsList}
          description={messages.reports.bookingsList}
        >
          {reportBookings.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={messages.reports.noDataTitle}
              description={messages.reports.noDataDescription}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {reportBookings.map((booking: ReportBooking) => (
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
                          {apartmentMap.get(booking.apartment_id) ?? messages.app.noData}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <BookingStatusBadge status={booking.booking_status} locale={locale} />
                        <PaymentStatusBadge status={booking.payment_status} locale={locale} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {formatShortDate(booking.check_in, locale)} -{" "}
                        {formatShortDate(booking.check_out, locale)}
                      </span>
                      <span>
                        {formatUsdAmount(
                          Number(booking.total_amount_usd ?? booking.total_amount),
                          displayCurrency,
                          locale,
                          rateSnapshot
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={messages.reports.expensesList}
          description={messages.reports.expensesList}
        >
          {reportExpensesRows.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title={messages.reports.noDataTitle}
              description={messages.reports.noDataDescription}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {reportExpensesRows.map((expense: ReportExpense) => (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}/edit?returnTo=/reports`}
                  className="rounded-2xl border border-border bg-surface-muted p-4 transition-colors hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {apartmentMap.get(expense.apartment_id) ?? messages.app.noData}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expense.note || messages.app.noData}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge tone="neutral" className="capitalize">
                        {getExpenseCategoryLabel(locale, expense.category)}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {formatShortDate(expense.expense_date, locale)}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatUsdAmount(
                          Number(expense.amount_usd ?? expense.amount),
                          displayCurrency,
                          locale,
                          rateSnapshot
                        )}
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
