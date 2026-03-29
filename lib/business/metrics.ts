import "server-only";

import {
  canCheckInBooking,
  canCheckOutBooking,
  isBlockingBookingStatus,
  isRevenueBookingStatus
} from "@/lib/business/rules";
import { listApartments } from "@/lib/data/apartments";
import { listBookings } from "@/lib/data/bookings";
import { listExpenses } from "@/lib/data/expenses";
import {
  eachDayOfInterval,
  getMonthStart,
  parseIsoDate,
  toIsoDate
} from "@/lib/dates";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

type BookingStatus =
  | "new"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

type ReportFilters = {
  from?: string;
  to?: string;
  apartmentId?: string;
  bookingStatus?: BookingStatus | "all";
};

function getBookingRevenueUsd(booking: BookingRow) {
  return Number(booking.total_amount_usd ?? booking.total_amount);
}

function getExpenseUsd(expense: ExpenseRow) {
  return Number(expense.amount_usd ?? expense.amount);
}

function getBookingNights(booking: Pick<BookingRow, "check_in" | "check_out">) {
  const start = parseIsoDate(booking.check_in);
  const end = parseIsoDate(booking.check_out);
  const diff = end.getTime() - start.getTime();
  return Math.max(Math.round(diff / 86400000), 0);
}

export type DashboardMetrics = {
  occupiedToday: number;
  freeToday: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  todayOperations: BookingRow[];
  recentBookings: BookingRow[];
  apartmentPerformance: Array<{
    apartmentId: string;
    apartmentTitle: string;
    bookingsCount: number;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  revenueTrend: Array<{
    label: string;
    total: number;
  }>;
};

export type ReportMetrics = {
  filters: {
    from: string;
    to: string;
    apartmentId?: string;
    bookingStatus: BookingStatus | "all";
  };
  revenue: number;
  expenses: number;
  profit: number;
  bookingsCount: number;
  averageBookingValue: number;
  averageRevenuePerNight: number;
  occupancySnapshot: {
    occupiedApartmentDays: number;
    availableApartmentDays: number;
    occupancyRate: number;
  };
  apartmentBreakdown: Array<{
    apartmentId: string;
    apartmentTitle: string;
    bookingsCount: number;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  expenseCategoryBreakdown: Array<{
    category: ExpenseRow["category"];
    total: number;
  }>;
  trend: Array<{
    label: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  bookings: BookingRow[];
  expensesRows: ExpenseRow[];
};

export const EMPTY_DASHBOARD_METRICS: DashboardMetrics = {
  occupiedToday: 0,
  freeToday: 0,
  upcomingCheckIns: 0,
  upcomingCheckOuts: 0,
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  monthlyProfit: 0,
  todayOperations: [],
  recentBookings: [],
  apartmentPerformance: [],
  revenueTrend: []
};

function startOfTodayIso() {
  return toIsoDate(new Date());
}

function addDays(isoDate: string, amount: number) {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + amount);
  return toIsoDate(date);
}

function isWithinInclusiveRange(value: string, from: string, to: string) {
  return value >= from && value <= to;
}

function overlapsRange(
  checkIn: string,
  checkOut: string,
  from: string,
  toExclusive: string
) {
  return checkIn < toExclusive && checkOut > from;
}

function normalizeReportFilters(filters: ReportFilters = {}) {
  const monthStart = getMonthStart();
  const from = filters.from ?? `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const to = filters.to ?? addDays(from, 30);

  return {
    from,
    to,
    apartmentId: filters.apartmentId,
    bookingStatus: filters.bookingStatus ?? "all"
  };
}

export function createEmptyReportMetrics(
  filters: ReportFilters = {}
): ReportMetrics {
  const normalized = normalizeReportFilters(filters);

  return {
    filters: normalized,
    revenue: 0,
    expenses: 0,
    profit: 0,
    bookingsCount: 0,
    averageBookingValue: 0,
    averageRevenuePerNight: 0,
    occupancySnapshot: {
      occupiedApartmentDays: 0,
      availableApartmentDays: 0,
      occupancyRate: 0
    },
    apartmentBreakdown: [],
    expenseCategoryBreakdown: [],
    trend: [],
    bookings: [],
    expensesRows: []
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = startOfTodayIso();
  const sevenDaysAhead = addDays(today, 7);
  const monthStart = getMonthStart();
  const currentMonthFrom = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
  );
  const currentMonthToExclusive = toIsoDate(nextMonth);

  const [apartmentsResult, bookingsResult, expensesResult] = await Promise.all([
    listApartments({ status: "all" }).catch((): ApartmentRow[] => []),
    listBookings({ includeCancelled: true }).catch((): BookingRow[] => []),
    listExpenses().catch((): ExpenseRow[] => [])
  ]);
  const apartments: ApartmentRow[] = apartmentsResult;
  const bookings: BookingRow[] = bookingsResult;
  const expenses: ExpenseRow[] = expensesResult;

  const activeApartments: ApartmentRow[] = apartments.filter(
    (apartment: ApartmentRow) => apartment.status === "active"
  );
  const occupiedTodayApartmentIds = new Set(
    bookings
      .filter(
        (booking: BookingRow) =>
          isBlockingBookingStatus(booking.booking_status) &&
          booking.check_in <= today &&
          booking.check_out > today
      )
      .map((booking: BookingRow) => booking.apartment_id)
  );

  const occupiedToday = activeApartments.filter((apartment: ApartmentRow) =>
    occupiedTodayApartmentIds.has(apartment.id)
  ).length;

  const monthlyRevenue = bookings
    .filter(
      (booking: BookingRow) =>
        isRevenueBookingStatus(booking.booking_status) &&
        booking.check_in >= currentMonthFrom &&
        booking.check_in < currentMonthToExclusive
    )
    .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);

  const monthlyExpenses = expenses
    .filter((expense: ExpenseRow) =>
      expense.expense_date >= currentMonthFrom &&
      expense.expense_date < currentMonthToExclusive
    )
    .reduce((sum, expense: ExpenseRow) => sum + getExpenseUsd(expense), 0);

  const todayOperations: BookingRow[] = bookings
    .filter(
      (booking: BookingRow) =>
        canCheckInBooking(booking.booking_status, booking.check_in, today) ||
        canCheckOutBooking(booking.booking_status, booking.check_out, today)
    )
    .sort((a: BookingRow, b: BookingRow) => a.check_in.localeCompare(b.check_in));

  const recentBookings: BookingRow[] = bookings
    .filter((booking: BookingRow) => booking.booking_status !== "cancelled")
    .sort((a: BookingRow, b: BookingRow) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const apartmentPerformance: DashboardMetrics["apartmentPerformance"] =
    activeApartments.map((apartment: ApartmentRow) => {
      const apartmentBookings: BookingRow[] = bookings.filter(
        (booking: BookingRow) => booking.apartment_id === apartment.id
      );
      const apartmentRevenue = apartmentBookings
        .filter((booking: BookingRow) => isRevenueBookingStatus(booking.booking_status))
        .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);
      const apartmentExpenses = expenses
        .filter((expense: ExpenseRow) => expense.apartment_id === apartment.id)
        .reduce((sum, expense: ExpenseRow) => sum + getExpenseUsd(expense), 0);

      return {
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        bookingsCount: apartmentBookings.filter(
          (booking: BookingRow) => booking.booking_status !== "cancelled"
        ).length,
        revenue: apartmentRevenue,
        expenses: apartmentExpenses,
        profit: apartmentRevenue - apartmentExpenses
      };
    });

  const revenueTrend: DashboardMetrics["revenueTrend"] = Array.from({
    length: 6
  }).map((_, index) => {
    const monthDate = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - (5 - index), 1)
    );
    const from = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
    const next = new Date(
      Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1)
    );
    const toExclusive = toIsoDate(next);
    const total = bookings
      .filter(
        (booking: BookingRow) =>
          isRevenueBookingStatus(booking.booking_status) &&
          booking.check_in >= from &&
          booking.check_in < toExclusive
      )
      .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);

    return {
      label: from.slice(0, 7),
      total
    };
  });

  return {
    occupiedToday,
    freeToday: Math.max(activeApartments.length - occupiedToday, 0),
    upcomingCheckIns: bookings.filter(
      (booking: BookingRow) =>
        booking.booking_status !== "cancelled" &&
        booking.check_in >= today &&
        booking.check_in < sevenDaysAhead
    ).length,
    upcomingCheckOuts: bookings.filter(
      (booking: BookingRow) =>
        booking.booking_status !== "cancelled" &&
        booking.check_out > today &&
        booking.check_out <= sevenDaysAhead
    ).length,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    todayOperations,
    recentBookings,
    apartmentPerformance: apartmentPerformance.sort(
      (a, b) => b.profit - a.profit
    ),
    revenueTrend
  };
}

export async function getReportMetrics(
  filters: ReportFilters = {}
): Promise<ReportMetrics> {
  const normalized = normalizeReportFilters(filters);
  const toExclusive = addDays(normalized.to, 1);

  const [apartmentsResult, bookingsResult, expensesResult] = await Promise.all([
    listApartments({ status: "all" }).catch((): ApartmentRow[] => []),
    listBookings({ includeCancelled: true }).catch((): BookingRow[] => []),
    listExpenses().catch((): ExpenseRow[] => [])
  ]);
  const apartments: ApartmentRow[] = apartmentsResult;
  const bookings: BookingRow[] = bookingsResult;
  const expenses: ExpenseRow[] = expensesResult;

  const periodBookings: BookingRow[] = bookings.filter((booking: BookingRow) => {
    const matchesApartment =
      !normalized.apartmentId || booking.apartment_id === normalized.apartmentId;
    const matchesStatus =
      normalized.bookingStatus === "all" ||
      booking.booking_status === normalized.bookingStatus;
    const matchesPeriod =
      booking.check_in >= normalized.from && booking.check_in < toExclusive;

    return matchesApartment && matchesStatus && matchesPeriod;
  });

  const occupancyBookings: BookingRow[] = bookings.filter((booking: BookingRow) => {
    const matchesApartment =
      !normalized.apartmentId || booking.apartment_id === normalized.apartmentId;
    const matchesStatus =
      normalized.bookingStatus === "all" ||
      booking.booking_status === normalized.bookingStatus;
    const matchesPeriod = overlapsRange(
      booking.check_in,
      booking.check_out,
      normalized.from,
      toExclusive
    );

    return matchesApartment && matchesStatus && matchesPeriod;
  });

  const filteredExpenses: ExpenseRow[] = expenses.filter((expense: ExpenseRow) => {
    const matchesApartment =
      !normalized.apartmentId || expense.apartment_id === normalized.apartmentId;
    const matchesPeriod = isWithinInclusiveRange(
      expense.expense_date,
      normalized.from,
      normalized.to
    );

    return matchesApartment && matchesPeriod;
  });

  const revenue = periodBookings
    .filter((booking: BookingRow) => isRevenueBookingStatus(booking.booking_status))
    .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);

  const expensesTotal = filteredExpenses.reduce(
    (sum, expense: ExpenseRow) => sum + getExpenseUsd(expense),
    0
  );

  const countableBookings =
    normalized.bookingStatus === "cancelled"
      ? periodBookings
      : periodBookings.filter(
          (booking: BookingRow) => booking.booking_status !== "cancelled"
        );
  const bookingsCount = countableBookings.length;

  const revenueBookings: BookingRow[] = periodBookings.filter(
    (booking: BookingRow) => isRevenueBookingStatus(booking.booking_status)
  );

  const averageBookingValue =
    revenueBookings.length > 0 ? revenue / revenueBookings.length : 0;
  const totalNights = revenueBookings.reduce(
    (sum, booking: BookingRow) => sum + getBookingNights(booking),
    0
  );
  const averageRevenuePerNight = totalNights > 0 ? revenue / totalNights : 0;

  const fromDate = parseIsoDate(normalized.from);
  const toDate = parseIsoDate(normalized.to);
  const totalDays = eachDayOfInterval(fromDate, toDate).length;
  const apartmentScope: ApartmentRow[] = apartments.filter(
    (apartment: ApartmentRow) =>
      !normalized.apartmentId || apartment.id === normalized.apartmentId
  );
  const occupancyApartmentScope: ApartmentRow[] = apartmentScope.filter(
    (apartment: ApartmentRow) =>
      normalized.apartmentId || apartment.status === "active"
  );
  const availableApartmentDays = occupancyApartmentScope.length * totalDays;
  let occupiedApartmentDays = 0;

  for (const day of eachDayOfInterval(fromDate, toDate)) {
    const dayIso = toIsoDate(day);
    const occupiedSet = new Set(
      occupancyBookings
        .filter(
          (booking: BookingRow) =>
            isBlockingBookingStatus(booking.booking_status) &&
            booking.check_in <= dayIso &&
            booking.check_out > dayIso
        )
        .map((booking: BookingRow) => booking.apartment_id)
    );

    occupiedApartmentDays += occupiedSet.size;
  }

  const occupancyRate =
    availableApartmentDays > 0 ? occupiedApartmentDays / availableApartmentDays : 0;

  const apartmentBreakdown: ReportMetrics["apartmentBreakdown"] =
    apartmentScope.map((apartment: ApartmentRow) => {
      const apartmentBookings: BookingRow[] = periodBookings.filter(
        (booking: BookingRow) => booking.apartment_id === apartment.id
      );
      const apartmentRevenue = apartmentBookings
        .filter((booking: BookingRow) => isRevenueBookingStatus(booking.booking_status))
        .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);
      const apartmentExpenses = filteredExpenses
        .filter((expense: ExpenseRow) => expense.apartment_id === apartment.id)
        .reduce((sum, expense: ExpenseRow) => sum + getExpenseUsd(expense), 0);

      return {
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        bookingsCount:
          normalized.bookingStatus === "cancelled"
            ? apartmentBookings.length
            : apartmentBookings.filter(
                (booking: BookingRow) => booking.booking_status !== "cancelled"
              ).length,
        revenue: apartmentRevenue,
        expenses: apartmentExpenses,
        profit: apartmentRevenue - apartmentExpenses
      };
    });

  const expenseCategoryBreakdown: ReportMetrics["expenseCategoryBreakdown"] = [
    "cleaning",
    "repair",
    "supplies",
    "utilities",
    "commission",
    "marketing",
    "other"
  ].map((category) => ({
    category,
    total: filteredExpenses
      .filter((expense: ExpenseRow) => expense.category === category)
      .reduce((sum, expense: ExpenseRow) => sum + getExpenseUsd(expense), 0)
  }));

  const rangeDays = eachDayOfInterval(fromDate, toDate).length;
  const trendBucketStarts =
    rangeDays <= 14
      ? eachDayOfInterval(fromDate, toDate).map((day) => toIsoDate(day))
      : rangeDays <= 90
        ? Array.from({ length: Math.ceil(rangeDays / 7) }).map((_, index) =>
            addDays(normalized.from, index * 7)
          )
        : Array.from({
            length:
              (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12 +
              (toDate.getUTCMonth() - fromDate.getUTCMonth()) +
              1
          }).map((_, index) =>
            toIsoDate(
              new Date(
                Date.UTC(
                  fromDate.getUTCFullYear(),
                  fromDate.getUTCMonth() + index,
                  1
                )
              )
            )
          );

  const trend: ReportMetrics["trend"] = trendBucketStarts.map((bucketStart) => {
    const bucketStartDate = parseIsoDate(bucketStart);
    const bucketEndExclusive =
      rangeDays <= 14
        ? addDays(bucketStart, 1)
        : rangeDays <= 90
          ? addDays(bucketStart, 7)
          : toIsoDate(
              new Date(
                Date.UTC(
                  bucketStartDate.getUTCFullYear(),
                  bucketStartDate.getUTCMonth() + 1,
                  1
                )
              )
            );

    const bucketRevenue = revenueBookings
      .filter(
        (booking: BookingRow) =>
          booking.check_in >= bucketStart && booking.check_in < bucketEndExclusive
      )
      .reduce((sum, booking: BookingRow) => sum + getBookingRevenueUsd(booking), 0);

    const bucketExpenses = filteredExpenses
      .filter(
        (expense: ExpenseRow) =>
          expense.expense_date >= bucketStart &&
          expense.expense_date < bucketEndExclusive
      )
      .reduce((sum, expense: ExpenseRow) => sum + getExpenseUsd(expense), 0);

    return {
      label:
        rangeDays <= 14
          ? bucketStart
          : rangeDays <= 90
            ? `${bucketStart} - ${addDays(bucketStart, 6)}`
            : bucketStart.slice(0, 7),
      revenue: bucketRevenue,
      expenses: bucketExpenses,
      profit: bucketRevenue - bucketExpenses
    };
  });

  return {
    filters: normalized,
    revenue,
    expenses: expensesTotal,
    profit: revenue - expensesTotal,
    bookingsCount,
    averageBookingValue,
    averageRevenuePerNight,
    occupancySnapshot: {
      occupiedApartmentDays,
      availableApartmentDays,
      occupancyRate
    },
    apartmentBreakdown,
    expenseCategoryBreakdown,
    trend,
    bookings: periodBookings,
    expensesRows: filteredExpenses
  };
}

