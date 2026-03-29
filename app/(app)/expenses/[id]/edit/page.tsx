import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteExpenseAction } from "@/app/(app)/expenses/actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";
import { getExpenseById } from "@/lib/data/expenses";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import type { Database } from "@/lib/supabase/database.types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type EditExpensePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

export default async function EditExpensePage({
  params,
  searchParams
}: EditExpensePageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [{ locale }, expenseResult, apartmentsResult] = await Promise.all([
    getAppPreferences(),
    getExpenseById(id),
    listApartments({ status: "all" })
  ]);
  const messages = getMessages(locale);

  if (!expenseResult) {
    return notFound();
  }

  const expense: ExpenseRow = expenseResult;
  const apartments: ApartmentRow[] = apartmentsResult;

  const returnTo = resolvedSearchParams?.returnTo ?? "/expenses";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.expenses.eyebrow}
        title={messages.app.edit}
        description={messages.expenses.description}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={returnTo}>{messages.app.back}</Link>
          </Button>
        }
      />

      <SectionCard
        title={messages.expenses.ledgerTitle}
        description={messages.expenses.filtersDesc}
      >
        <ExpenseForm
          expense={expense}
          apartments={apartments}
          returnTo={returnTo}
          locale={locale}
        />
      </SectionCard>

      <SectionCard
        title={messages.app.delete}
        description={messages.expenses.emptyDescription}
      >
        <form action={deleteExpenseAction}>
          <input type="hidden" name="expenseId" value={expense.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button
            type="submit"
            variant="outline"
            className="border-danger/30 text-danger hover:bg-danger/5"
          >
            {messages.app.delete}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
