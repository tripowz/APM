import "server-only";

import {
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

export type DashboardMetrics = {
  occupiedToday: number;
  freeToday: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
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
  bookings: BookingRow[];
  expensesRows: ExpenseRow[];
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

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = startOfTodayIso();
  const sevenDaysAhead = addDays(today, 7);
  const monthStart = getMonthStart();
  const currentMonthFrom = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
  );
  const currentMonthToExclusive = toIsoDate(nextMonth);

  const [apartments, bookings, expenses] = await Promise.all([
    listApartments({ status: "all" }),
    listBookings({ includeCancelled: true }),
    listExpenses()
  ]);

  const activeApartments = apartments.filter((apartment) => apartment.status === "active");
  const occupiedTodayApartmentIds = new Set(
    bookings
      .filter(
        (booking) =>
          isBlockingBookingStatus(booking.booking_status) &&
          booking.check_in <= today &&
          booking.check_out > today
      )
      .map((booking) => booking.apartment_id)
  );

  const occupiedToday = activeApartments.filter((apartment) =>
    occupiedTodayApartmentIds.has(apartment.id)
  ).length;

  const monthlyRevenue = bookings
    .filter(
      (booking) =>
        isRevenueBookingStatus(booking.booking_status) &&
        booking.check_in >= currentMonthFrom &&
        booking.check_in < currentMonthToExclusive
    )
    .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

  const monthlyExpenses = expenses
    .filter((expense) =>
      expense.expense_date >= currentMonthFrom &&
      expense.expense_date < currentMonthToExclusive
    )
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const recentBookings = bookings
    .filter((booking) => booking.booking_status !== "cancelled")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const apartmentPerformance = activeApartments.map((apartment) => {
    const apartmentBookings = bookings.filter(
      (booking) => booking.apartment_id === apartment.id
    );
    const apartmentRevenue = apartmentBookings
      .filter((booking) => isRevenueBookingStatus(booking.booking_status))
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const apartmentExpenses = expenses
      .filter((expense) => expense.apartment_id === apartment.id)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
      bookingsCount: apartmentBookings.filter(
        (booking) => booking.booking_status !== "cancelled"
      ).length,
      revenue: apartmentRevenue,
      expenses: apartmentExpenses,
      profit: apartmentRevenue - apartmentExpenses
    };
  });

  const revenueTrend = Array.from({ length: 6 }).map((_, index) => {
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
        (booking) =>
          isRevenueBookingStatus(booking.booking_status) &&
          booking.check_in >= from &&
          booking.check_in < toExclusive
      )
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

    return {
      label: monthDate.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC"
      }),
      total
    };
  });

  return {
    occupiedToday,
    freeToday: Math.max(activeApartments.length - occupiedToday, 0),
    upcomingCheckIns: bookings.filter(
      (booking) =>
        booking.booking_status !== "cancelled" &&
        booking.check_in >= today &&
        booking.check_in < sevenDaysAhead
    ).length,
    upcomingCheckOuts: bookings.filter(
      (booking) =>
        booking.booking_status !== "cancelled" &&
        booking.check_out > today &&
        booking.check_out <= sevenDaysAhead
    ).length,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    recentBookings,
    apartmentPerformance: apartmentPerformance.sort((a, b) => b.profit - a.profit),
    revenueTrend
  };
}

export async function getReportMetrics(
  filters: ReportFilters = {}
): Promise<ReportMetrics> {
  const normalized = normalizeReportFilters(filters);
  const toExclusive = addDays(normalized.to, 1);

  const [apartments, bookings, expenses] = await Promise.all([
    listApartments({ status: "all" }),
    listBookings({ includeCancelled: true }),
    listExpenses()
  ]);

  const periodBookings = bookings.filter((booking) => {
    const matchesApartment =
      !normalized.apartmentId || booking.apartment_id === normalized.apartmentId;
    const matchesStatus =
      normalized.bookingStatus === "all" ||
      booking.booking_status === normalized.bookingStatus;
    const matchesPeriod =
      booking.check_in >= normalized.from && booking.check_in < toExclusive;

    return matchesApartment && matchesStatus && matchesPeriod;
  });

  const occupancyBookings = bookings.filter((booking) => {
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

  const filteredExpenses = expenses.filter((expense) => {
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
    .filter((booking) => isRevenueBookingStatus(booking.booking_status))
    .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

  const expensesTotal = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const countableBookings =
    normalized.bookingStatus === "cancelled"
      ? periodBookings
      : periodBookings.filter((booking) => booking.booking_status !== "cancelled");
  const bookingsCount = countableBookings.length;

  const revenueBookings = periodBookings.filter((booking) =>
    isRevenueBookingStatus(booking.booking_status)
  );

  const averageBookingValue =
    revenueBookings.length > 0 ? revenue / revenueBookings.length : 0;

  const fromDate = parseIsoDate(normalized.from);
  const toDate = parseIsoDate(normalized.to);
  const totalDays = eachDayOfInterval(fromDate, toDate).length;
  const apartmentScope = apartments.filter(
    (apartment) => !normalized.apartmentId || apartment.id === normalized.apartmentId
  );
  const occupancyApartmentScope = apartmentScope.filter(
    (apartment) => normalized.apartmentId || apartment.status === "active"
  );
  const availableApartmentDays = occupancyApartmentScope.length * totalDays;
  let occupiedApartmentDays = 0;

  for (const day of eachDayOfInterval(fromDate, toDate)) {
    const dayIso = toIsoDate(day);
    const occupiedSet = new Set(
      occupancyBookings
        .filter(
          (booking) =>
            isBlockingBookingStatus(booking.booking_status) &&
            booking.check_in <= dayIso &&
            booking.check_out > dayIso
        )
        .map((booking) => booking.apartment_id)
    );

    occupiedApartmentDays += occupiedSet.size;
  }

  const occupancyRate =
    availableApartmentDays > 0 ? occupiedApartmentDays / availableApartmentDays : 0;

  const apartmentBreakdown = apartmentScope.map((apartment) => {
    const apartmentBookings = periodBookings.filter(
      (booking) => booking.apartment_id === apartment.id
    );
    const apartmentRevenue = apartmentBookings
      .filter((booking) => isRevenueBookingStatus(booking.booking_status))
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
    const apartmentExpenses = filteredExpenses
      .filter((expense) => expense.apartment_id === apartment.id)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      apartmentId: apartment.id,
      apartmentTitle: apartment.title,
      bookingsCount:
        normalized.bookingStatus === "cancelled"
          ? apartmentBookings.length
          : apartmentBookings.filter((booking) => booking.booking_status !== "cancelled")
              .length,
      revenue: apartmentRevenue,
      expenses: apartmentExpenses,
      profit: apartmentRevenue - apartmentExpenses
    };
  });

  return {
    filters: normalized,
    revenue,
    expenses: expensesTotal,
    profit: revenue - expensesTotal,
    bookingsCount,
    averageBookingValue,
    occupancySnapshot: {
      occupiedApartmentDays,
      availableApartmentDays,
      occupancyRate
    },
    apartmentBreakdown,
    bookings: periodBookings,
    expensesRows: filteredExpenses
  };
}
