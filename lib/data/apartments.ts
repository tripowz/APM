import "server-only";

import { isRevenueBookingStatus } from "@/lib/business/rules";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { listBookings } from "@/lib/data/bookings";
import { listExpenses } from "@/lib/data/expenses";
import {
  toTableRow,
  toMaybeTableRow,
  toSupabaseInsert,
  toSupabaseUpdate,
  toTableRows
} from "@/lib/supabase/tables";
import {
  apartmentSchema,
  apartmentUpdateSchema,
  type ApartmentInput,
  type ApartmentUpdateInput
} from "@/lib/validations/apartment";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type ApartmentInsert = Database["public"]["Tables"]["apartments"]["Insert"];
type ApartmentUpdate = Database["public"]["Tables"]["apartments"]["Update"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ApartmentStats = {
  bookingsCount: number;
  revenue: number;
  expenses: number;
  profit: number;
};

export type ApartmentDetails = {
  apartment: ApartmentRow;
  bookings: BookingRow[];
  expenses: ExpenseRow[];
  stats: ApartmentStats;
};

export type ApartmentSummary = ApartmentRow & {
  stats: ApartmentStats;
};

type ListApartmentFilters = {
  query?: string;
  status?: "active" | "inactive" | "all";
};

export async function listApartments(
  filters: ListApartmentFilters = {}
): Promise<ApartmentRow[]> {
  const supabase = await createClient();
  const { data: apartmentsResult, error } = await supabase
    .from("apartments")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Failed to load apartments: ${error.message}`);
  }

  const apartments: ApartmentRow[] = toTableRows<"apartments">(apartmentsResult);

  return apartments.filter((apartment: ApartmentRow) => {
    const matchesStatus =
      !filters.status || filters.status === "all" || apartment.status === filters.status;
    const search = filters.query?.trim().toLowerCase();
    const matchesSearch =
      !search ||
      apartment.title.toLowerCase().includes(search) ||
      apartment.address.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });
}

export async function getApartmentById(id: string): Promise<ApartmentRow | null> {
  const supabase = await createClient();
  const { data: apartmentResult, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load apartment: ${error.message}`);
  }

  return toMaybeTableRow<"apartments">(apartmentResult);
}

export async function getApartmentDetails(
  id: string
): Promise<ApartmentDetails | null> {
  const apartmentResult = await getApartmentById(id);

  if (!apartmentResult) {
    return null;
  }

  const apartment: ApartmentRow = apartmentResult;

  const [bookingsResult, expensesResult] = await Promise.all([
    listBookings({ apartmentId: id, includeCancelled: true }).catch(
      (): BookingRow[] => []
    ),
    listExpenses(id).catch((): ExpenseRow[] => [])
  ]);
  const bookings: BookingRow[] = bookingsResult;
  const expenses: ExpenseRow[] = expensesResult;

  const activeBookings: BookingRow[] = bookings.filter(
    (booking: BookingRow) => booking.booking_status !== "cancelled"
  );
  const revenue = activeBookings
    .filter((booking: BookingRow) => isRevenueBookingStatus(booking.booking_status))
    .reduce(
      (total, booking: BookingRow) =>
        total + Number(booking.total_amount_usd ?? booking.total_amount),
      0
    );
  const totalExpenses = expenses.reduce(
    (total, expense: ExpenseRow) =>
      total + Number(expense.amount_usd ?? expense.amount),
    0
  );

  return {
    apartment,
    bookings,
    expenses,
    stats: {
      bookingsCount: activeBookings.length,
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses
    }
  };
}

export async function listApartmentSummaries(
  filters: ListApartmentFilters = {}
): Promise<ApartmentSummary[]> {
  const apartments = await listApartments(filters);
  const [bookingsResult, expensesResult] = await Promise.all([
    listBookings().catch((): BookingRow[] => []),
    listExpenses().catch((): ExpenseRow[] => [])
  ]);
  const bookings: BookingRow[] = bookingsResult;
  const expenses: ExpenseRow[] = expensesResult;

  return apartments.map((apartment): ApartmentSummary => {
    const apartmentBookings: BookingRow[] = bookings.filter(
      (booking) =>
        booking.apartment_id === apartment.id && booking.booking_status !== "cancelled"
    );
    const apartmentExpenses: ExpenseRow[] = expenses.filter(
      (expense) => expense.apartment_id === apartment.id
    );
    const revenue = apartmentBookings
      .filter((booking: BookingRow) => isRevenueBookingStatus(booking.booking_status))
      .reduce(
        (total, booking: BookingRow) =>
          total + Number(booking.total_amount_usd ?? booking.total_amount),
        0
      );
    const expensesTotal = apartmentExpenses.reduce(
      (total, expense: ExpenseRow) =>
        total + Number(expense.amount_usd ?? expense.amount),
      0
    );

    return {
      ...apartment,
      stats: {
        bookingsCount: apartmentBookings.length,
        revenue,
        expenses: expensesTotal,
        profit: revenue - expensesTotal
      }
    };
  });
}

export async function createApartment(input: ApartmentInput): Promise<ApartmentRow> {
  const supabase = await createClient();
  const payload: ApartmentInsert = apartmentSchema.parse(input);
  const { data: apartmentResult, error } = await supabase
    .from("apartments")
    .insert(toSupabaseInsert<"apartments">(payload))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create apartment: ${error.message}`);
  }

  return toTableRow<"apartments">(apartmentResult);
}

export async function updateApartment(
  id: string,
  input: ApartmentUpdateInput
): Promise<ApartmentRow> {
  const payload: ApartmentUpdate = apartmentUpdateSchema.parse(input);
  const supabase = await createClient();
  const { data: apartmentResult, error } = await supabase
    .from("apartments")
    .update(toSupabaseUpdate<"apartments">(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update apartment: ${error.message}`);
  }

  return toTableRow<"apartments">(apartmentResult);
}

export async function deleteApartment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("apartments").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete apartment: ${error.message}`);
  }
}
