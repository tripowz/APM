import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteExpenseAction } from "@/app/(app)/expenses/actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";
import { getExpenseById } from "@/lib/data/expenses";
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
  const [expenseResult, apartmentsResult] = await Promise.all([
    getExpenseById(id),
    listApartments({ status: "all" })
  ]);

  if (!expenseResult) {
    notFound();
  }

  const expense: ExpenseRow = expenseResult;
  const apartments: ApartmentRow[] = apartmentsResult;

  const returnTo = resolvedSearchParams?.returnTo ?? "/expenses";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Expenses"
        title="Edit expense"
        description="Update the category, date, apartment, or note for this expense."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={returnTo}>Back</Link>
          </Button>
        }
      />

      <SectionCard
        title="Expense details"
        description="Changes here are reflected in apartment profit and reports."
      >
        <ExpenseForm expense={expense} apartments={apartments} returnTo={returnTo} />
      </SectionCard>

      <SectionCard
        title="Delete expense"
        description="Delete the expense if it was entered by mistake."
      >
        <form action={deleteExpenseAction}>
          <input type="hidden" name="expenseId" value={expense.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button
            type="submit"
            variant="outline"
            className="border-danger/30 text-danger hover:bg-danger/5"
          >
            Delete expense
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
