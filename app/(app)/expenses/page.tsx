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
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { listExpenses } from "@/lib/data/expenses";
import { getMessages } from "@/lib/i18n/messages";
import { formatShortDate, getMonthStart, toIsoDate } from "@/lib/dates";
import { formatUsdAmount } from "@/lib/formatters";
import { getAppPreferences } from "@/lib/preferences";
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

  const [apartmentsResult, expenses, preferences, rateSnapshot] = await Promise.all([
    listApartments({ status: "all" }).catch((): ApartmentRow[] => []),
    listExpenses(filters).catch((): ExpenseRow[] => []),
    getAppPreferences(),
    getLatestUsdToUzsRate().catch(() => null)
  ]);
  const apartments: ApartmentRow[] = apartmentsResult;
  const expenseRows: ExpenseRow[] = expenses;
  const locale = preferences.locale;
  const displayCurrency = preferences.displayCurrency;
  const messages = getMessages(locale);

  const apartmentMap = new Map(
    apartments.map((apartment: ApartmentRow) => [apartment.id, apartment] as const)
  );
  const totalExpenses = expenseRows.reduce(
    (sum, expense: ExpenseRow) =>
      sum + Number(expense.amount_usd ?? expense.amount),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresh
        channel="expenses-ledger-refresh"
        tables={["apartments", "expenses", "settings"]}
      />

      <PageHeader
        eyebrow={messages.expenses.eyebrow}
        title={messages.expenses.title}
        description={messages.expenses.description}
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/expenses/new">{messages.expenses.addExpense}</Link>
          </Button>
        }
      />

      <SectionCard
        title={messages.expenses.filtersTitle}
        description={messages.expenses.filtersDesc}
        actions={<StatusBadge tone="info">{expenseRows.length}</StatusBadge>}
      >
        <form className="grid gap-4 xl:grid-cols-[160px_160px_240px_220px_auto]">
          <Input type="date" name="from" defaultValue={filters.from} />
          <Input type="date" name="to" defaultValue={filters.to} />
          <Select name="apartmentId" defaultValue={filters.apartmentId ?? ""}>
            <option value="">{messages.calendar.allApartments}</option>
            {apartments.map((apartment: ApartmentRow) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.title}
              </option>
            ))}
          </Select>
          <Select name="category" defaultValue={filters.category}>
            <option value="all">{messages.expenses.allCategories}</option>
            <option value="cleaning">{messages.statuses.expenseCategory.cleaning}</option>
            <option value="repair">{messages.statuses.expenseCategory.repair}</option>
            <option value="supplies">{messages.statuses.expenseCategory.supplies}</option>
            <option value="utilities">{messages.statuses.expenseCategory.utilities}</option>
            <option value="commission">{messages.statuses.expenseCategory.commission}</option>
            <option value="marketing">{messages.statuses.expenseCategory.marketing}</option>
            <option value="other">{messages.statuses.expenseCategory.other}</option>
          </Select>
          <Button type="submit" variant="secondary">
            {messages.app.apply}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title={messages.expenses.ledgerTitle}
        description={`${messages.expenses.totalForPeriod}: ${formatUsdAmount(
          totalExpenses,
          displayCurrency,
          locale,
          rateSnapshot
        )}.`}
      >
        {expenseRows.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <ReceiptText className="size-6 text-foreground" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {messages.expenses.emptyTitle}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {messages.expenses.emptyDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1.3fr_0.7fr_0.8fr_0.7fr_120px] gap-4 bg-surface-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
              <span>{messages.expenses.apartment}</span>
              <span>{messages.expenses.date}</span>
              <span>{messages.expenses.category}</span>
              <span>{messages.expenses.amount}</span>
              <span className="text-right">{messages.app.edit}</span>
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
                        {apartment?.title ?? messages.app.noData}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {expense.note || messages.app.noData}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(expense.expense_date, locale)}
                    </p>
                    <div>
                      <StatusBadge tone="neutral" className="capitalize">
                        {messages.statuses.expenseCategory[expense.category]}
                      </StatusBadge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatUsdAmount(
                        Number(expense.amount_usd ?? expense.amount),
                        displayCurrency,
                        locale,
                        rateSnapshot
                      )}
                    </p>
                    <div className="md:text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/expenses/${expense.id}/edit`}>
                          {messages.app.edit}
                        </Link>
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
