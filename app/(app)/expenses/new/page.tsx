import Link from "next/link";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";

type NewExpensePageProps = {
  searchParams?: Promise<{
    apartmentId?: string;
    returnTo?: string;
  }>;
};

export default async function NewExpensePage({
  searchParams
}: NewExpensePageProps) {
  const params = await searchParams;
  const apartments = await listApartments({ status: "all" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Expenses"
        title="Create expense"
        description="Attach a new expense to an apartment and keep the ledger clean for reporting."
        actions={
          params?.returnTo ? (
            <Button asChild variant="outline" size="lg">
              <Link href={params.returnTo}>Back</Link>
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Expense details"
        description="Choose the apartment, category, date, and amount for this expense."
      >
        <ExpenseForm
          apartments={apartments}
          defaultApartmentId={params?.apartmentId}
          returnTo={params?.returnTo}
        />
      </SectionCard>
    </div>
  );
}
