import { notFound } from "next/navigation";

import { ApartmentForm } from "@/components/apartments/apartment-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getApartmentById } from "@/lib/data/apartments";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";
import type { Database } from "@/lib/supabase/database.types";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

type EditApartmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApartmentPage({
  params
}: EditApartmentPageProps) {
  const { id } = await params;
  const [{ locale }, apartmentResult] = await Promise.all([
    getAppPreferences(),
    getApartmentById(id)
  ]);
  const messages = getMessages(locale);

  if (!apartmentResult) {
    return notFound();
  }

  const apartment: ApartmentRow = apartmentResult;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.apartments.eyebrow}
        title={`${messages.app.edit}: ${apartment.title}`}
        description={messages.apartments.description}
      />

      <SectionCard
        title={messages.apartments.form.title}
        description={messages.apartments.description}
      >
        <ApartmentForm apartment={apartment} locale={locale} />
      </SectionCard>
    </div>
  );
}
