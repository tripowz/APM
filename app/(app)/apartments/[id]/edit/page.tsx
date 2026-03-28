import { notFound } from "next/navigation";

import { ApartmentForm } from "@/components/apartments/apartment-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getApartmentById } from "@/lib/data/apartments";

type EditApartmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApartmentPage({
  params
}: EditApartmentPageProps) {
  const { id } = await params;
  const apartment = (await getApartmentById(id)) ?? notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Apartments"
        title={`Edit ${apartment.title}`}
        description="Update the apartment profile, pricing, and active status."
      />

      <SectionCard
        title="Apartment details"
        description="Changes here update the apartment profile used throughout bookings and reporting."
      >
        <ApartmentForm apartment={apartment} />
      </SectionCard>
    </div>
  );
}
