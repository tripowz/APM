import { ApartmentForm } from "@/components/apartments/apartment-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export default function NewApartmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Apartments"
        title="Create apartment"
        description="Add a new apartment with its base pricing, address, and internal notes."
      />

      <SectionCard
        title="Apartment details"
        description="These values drive bookings, pricing, and apartment reporting."
      >
        <ApartmentForm />
      </SectionCard>
    </div>
  );
}
