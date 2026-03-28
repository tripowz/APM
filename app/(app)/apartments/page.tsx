import Link from "next/link";
import { Building2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listApartmentSummaries } from "@/lib/data/apartments";
import { getSettings } from "@/lib/data/settings";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";

type ApartmentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: "active" | "inactive" | "all";
  }>;
};

export default async function ApartmentsPage({
  searchParams
}: ApartmentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const status = params?.status ?? "all";
  const [apartments, settings] = await Promise.all([
    listApartmentSummaries({
      query,
      status
    }),
    getSettings().catch(() => null)
  ]);

  const currency = settings?.currency ?? "USD";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Apartments"
        title="Apartment inventory workspace"
        description="Search, review, and maintain each apartment with a clean operational summary."
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/apartments/new">New apartment</Link>
          </Button>
        }
      />

      <SectionCard
        title="Filters"
        description="Search by apartment title or address, then narrow by current apartment status."
      >
        <form className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search apartment title or address"
              className="pl-11"
            />
          </div>
          <Select name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Apartment list"
        description={`${apartments.length} apartment${apartments.length === 1 ? "" : "s"} matched your current filters.`}
      >
        {apartments.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <Building2 className="size-6 text-foreground" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h3 className="text-base font-semibold text-foreground">
                No apartments match the current filters
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Clear the search or add a new apartment to start tracking bookings,
                expenses, and profitability.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {apartments.map((apartment) => (
              <article
                key={apartment.id}
                className="surface-muted flex flex-col gap-5 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {apartment.title}
                      </h3>
                      <StatusBadge
                        tone={apartment.status === "active" ? "success" : "neutral"}
                      >
                        {apartment.status}
                      </StatusBadge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {apartment.address}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/apartments/${apartment.id}`}>Open</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Bookings
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCompactNumber(apartment.stats.bookingsCount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Revenue
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCurrency(apartment.stats.revenue, currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Expenses
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCurrency(apartment.stats.expenses, currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Profit
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCurrency(apartment.stats.profit, currency)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
