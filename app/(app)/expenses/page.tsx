import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listApartments } from "@/lib/data/apartments";
import { listExpenses } from "@/lib/data/expenses";
import { getSettings, type SettingsRow } from "@/lib/data/settings";
import { getMonthStart, toIsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

type ExpensesPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    apartmentId?: string;
    category?:
      | "cleaning"
      | "repair"
      | "supplies"
      | "utilities"
      | "commission"
      | "marketing"
      | "other"
      | "all";
  }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const currentMonthStart = toIsoDate(getMonthStart());
  const today = toIsoDate(new Date());
  const filters = {
    from: params?.from ?? currentMonthStart,
    to: params?.to ?? today,
    apartmentId: params?.apartmentId,
    category: params?.category ?? "all"
  } as const;

  const [apartmentsResult, expenses, settings] = await Promise.all([
    listApartments({ status: "all" }),
    listExpenses(filters),
    getSettings().catch((): SettingsRow | null => null)
  ]);
  const apartments: ApartmentRow[] = apartmentsResult;
  const expenseRows: ExpenseRow[] = expenses;

  const currency = settings?.currency ?? "USD";
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartment.id, apartment] as const)
  );
  const totalExpenses = expenseRows.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="expenses-ledger-refresh"
        tables={["apartments", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow="Expenses"
        title="Expense ledger"
        description="Track apartment expenses with practical filters and a clean internal workflow."
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/expenses/new">Add expense</Link>
          </Button>
        }
      />

      <SectionCard
        title="Filters"
        description="Filter expenses by date range, apartment, and category."
        actions={<StatusBadge tone="info">{expenseRows.length} entries</StatusBadge>}
      >
        <form className="grid gap-4 xl:grid-cols-[160px_160px_240px_220px_auto]">
          <Input type="date" name="from" defaultValue={filters.from} />
          <Input type="date" name="to" defaultValue={filters.to} />
          <Select name="apartmentId" defaultValue={filters.apartmentId ?? ""}>
            <option value="">All apartments</option>
            {apartments.map((apartment: ApartmentRow) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <Select name="category" defaultValue={filters.category}>
            <option value="all">All categories</option>
            <option value="cleaning">Cleaning</option>
            <option value="repair">Repair</option>
            <option value="supplies">Supplies</option>
            <option value="utilities">Utilities</option>
            <option value="commission">Commission</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Expense ledger"
        description={`Total spend in this filtered view: ${formatCurrency(totalExpenses, currency)}.`}
      >
        {expenseRows.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <ReceiptText className="size-6 text-foreground" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h3 className="text-base font-semibold text-foreground">
                No expenses match the current filters
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Adjust the current period or category filters, or create a new
                expense entry for an apartment.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1.3fr_0.7fr_0.8fr_0.7fr_120px] gap-4 bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>Apartment</span>
              <span>Date</span>
              <span>Category</span>
              <span>Amount</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-border">
              {expenseRows.map((expense: ExpenseRow) => {
                const apartment = apartmentMap.get(expense.apartment_id);

                return (
                  <div
                    key={expense.id}
                    className="grid gap-3 bg-white px-4 py-4 md:grid-cols-[1.3fr_0.7fr_0.8fr_0.7fr_120px] md:items-center"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        {apartment?.title ?? "Unknown apartment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expense.note || "No note added"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {expense.expense_date}
                    </p>
                    <div>
                      <StatusBadge tone="neutral" className="capitalize">
                        {expense.category}
                      </StatusBadge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(Number(expense.amount), currency)}
                    </p>
                    <div className="md:text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/expenses/${expense.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
