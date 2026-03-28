import "server-only";

import { isRevenueBookingStatus } from "@/lib/business/rules";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { listBookings } from "@/lib/data/bookings";
import { listExpenses } from "@/lib/data/expenses";
import {
  apartmentSchema,
  apartmentUpdateSchema,
  type ApartmentInput,
  type ApartmentUpdateInput
} from "@/lib/validations/apartment";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type ListApartmentFilters = {
  query?: string;
  status?: "active" | "inactive" | "all";
};

export async function listApartments(
  filters: ListApartmentFilters = {}
): Promise<ApartmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Failed to load apartments: ${error.message}`);
  }

  return data.filter((apartment) => {
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
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load apartment: ${error.message}`);
  }

  return data;
}

export async function getApartmentDetails(id: string) {
  const apartmentResult = await getApartmentById(id);

  if (!apartmentResult) {
    return null;
  }

  const apartment: ApartmentRow = apartmentResult;

  const [bookingsResult, expensesResult] = await Promise.all([
    listBookings({ apartmentId: id, includeCancelled: true }),
    listExpenses(id)
  ]);
  const bookings = bookingsResult;
  const expenses = expensesResult;

  const activeBookings = bookings.filter((booking) => booking.booking_status !== "cancelled");
  const revenue = activeBookings
    .filter((booking) => isRevenueBookingStatus(booking.booking_status))
    .reduce((total, booking) => total + Number(booking.total_amount), 0);
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
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

export async function listApartmentSummaries(filters: ListApartmentFilters = {}) {
  const apartments = await listApartments(filters);
  const [bookingsResult, expensesResult] = await Promise.all([
    listBookings(),
    listExpenses()
  ]);
  const bookings = bookingsResult;
  const expenses = expensesResult;

  return apartments.map((apartment) => {
    const apartmentBookings = bookings.filter(
      (booking) =>
        booking.apartment_id === apartment.id && booking.booking_status !== "cancelled"
    );
    const apartmentExpenses = expenses.filter(
      (expense) => expense.apartment_id === apartment.id
    );
    const revenue = apartmentBookings
      .filter((booking) => isRevenueBookingStatus(booking.booking_status))
      .reduce((total, booking) => total + Number(booking.total_amount), 0);
    const expensesTotal = apartmentExpenses.reduce(
      (total, expense) => total + Number(expense.amount),
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

export async function createApartment(input: ApartmentInput) {
  const payload = apartmentSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create apartment: ${error.message}`);
  }

  return data;
}

export async function updateApartment(id: string, input: ApartmentUpdateInput) {
  const payload = apartmentUpdateSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update apartment: ${error.message}`);
  }

  return data;
}

export async function deleteApartment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("apartments").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete apartment: ${error.message}`);
  }
}
