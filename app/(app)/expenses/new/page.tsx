import Link from "next/link";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { listApartments } from "@/lib/data/apartments";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";

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
  const [{ locale }, apartments] = await Promise.all([
    getAppPreferences(),
    listApartments({ status: "all" })
  ]);
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.expenses.eyebrow}
        title={messages.expenses.addExpense}
        description={messages.expenses.description}
        actions={
          params?.returnTo ? (
            <Button asChild variant="outline" size="lg">
              <Link href={params.returnTo}>{messages.app.back}</Link>
            </Button>
          ) : null
        }
      />

      <SectionCard
        title={messages.expenses.ledgerTitle}
        description={messages.expenses.filtersDesc}
      >
        <ExpenseForm
          apartments={apartments}
          defaultApartmentId={params?.apartmentId}
          returnTo={params?.returnTo}
          locale={locale}
        />
      </SectionCard>
    </div>
  );
}
