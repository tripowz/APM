import { ApartmentForm } from "@/components/apartments/apartment-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getMessages } from "@/lib/i18n/messages";
import { getAppPreferences } from "@/lib/preferences";

export default async function NewApartmentPage() {
  const { locale } = await getAppPreferences();
  const messages = getMessages(locale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={messages.apartments.eyebrow}
        title={messages.apartments.newApartment}
        description={messages.apartments.description}
      />

      <SectionCard
        title={messages.apartments.form.title}
        description={messages.apartments.description}
      >
        <ApartmentForm locale={locale} />
      </SectionCard>
    </div>
  );
}
