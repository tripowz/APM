import Link from "next/link";
import { Building2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listApartmentSummaries } from "@/lib/data/apartments";
import { getLatestUsdToUzsRate } from "@/lib/data/exchange-rates";
import { formatCompactNumber, formatUsdAmount } from "@/lib/formatters";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";

type ApartmentSummary = Awaited<ReturnType<typeof listApartmentSummaries>>[number];

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
  const [apartmentsResult, preferences, rateSnapshot] = await Promise.all([
    listApartmentSummaries({
      query,
      status
    }).catch((): ApartmentSummary[] => []),
    getAppPreferences(),
    getLatestUsdToUzsRate().catch(() => null)
  ]);
  const apartments: ApartmentSummary[] = apartmentsResult;
  const locale = preferences.locale;
  const displayCurrency = preferences.displayCurrency;
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.apartments.eyebrow}
        title={messages.apartments.title}
        description={messages.apartments.description}
        actions={
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/apartments/new">{messages.apartments.newApartment}</Link>
          </Button>
        }
      />

      <SectionCard
        title={messages.apartments.filtersTitle}
        description={messages.apartments.filtersDesc}
      >
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder={messages.apartments.searchPlaceholder}
              className="pl-11"
            />
          </div>
          <Select name="status" defaultValue={status}>
            <option value="all">{messages.apartments.allStatuses}</option>
            <option value="active">{messages.statuses.apartmentStatus.active}</option>
            <option value="inactive">{messages.statuses.apartmentStatus.inactive}</option>
          </Select>
          <Button type="submit" variant="secondary" className="w-full sm:w-auto">
            {messages.app.apply}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title={messages.apartments.listTitle}
        description={
          apartments.length === 0
            ? messages.apartments.noneDescription
            : messages.apartments.description
        }
      >
        {apartments.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <Building2 className="size-6 text-foreground" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {messages.apartments.noneTitle}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {messages.apartments.noneDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {apartments.map((apartment: ApartmentSummary) => (
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
                        {messages.statuses.apartmentStatus[apartment.status]}
                      </StatusBadge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {apartment.address}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/apartments/${apartment.id}`}>{messages.apartments.open}</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {messages.apartments.bookings}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatCompactNumber(apartment.stats.bookingsCount, locale)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {messages.apartments.revenue}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatUsdAmount(
                        apartment.stats.revenue,
                        displayCurrency,
                        locale,
                        rateSnapshot
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {messages.apartments.expenses}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatUsdAmount(
                        apartment.stats.expenses,
                        displayCurrency,
                        locale,
                        rateSnapshot
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {messages.apartments.profit}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {formatUsdAmount(
                        apartment.stats.profit,
                        displayCurrency,
                        locale,
                        rateSnapshot
                      )}
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
