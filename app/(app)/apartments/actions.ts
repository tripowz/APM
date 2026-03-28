"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createApartment,
  updateApartment
} from "@/lib/data/apartments";

export type ApartmentFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const apartmentFormSchema = z.object({
  apartmentId: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Title is required."),
  address: z.string().trim().min(5, "Address is required."),
  base_price: z.coerce.number().nonnegative("Base price cannot be negative."),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional()
});

export async function saveApartmentAction(
  _prevState: ApartmentFormState,
  formData: FormData
): Promise<ApartmentFormState> {
  const parsed = apartmentFormSchema.safeParse({
    apartmentId: formData.get("apartmentId") || undefined,
    title: formData.get("title"),
    address: formData.get("address"),
    base_price: formData.get("base_price"),
    status: formData.get("status"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: "Review the apartment details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const apartment = parsed.data.apartmentId
      ? await updateApartment(parsed.data.apartmentId, parsed.data)
      : await createApartment(parsed.data);

    revalidatePath("/apartments");
    revalidatePath(`/apartments/${apartment.id}`);
    revalidatePath("/dashboard");

    redirect(`/apartments/${apartment.id}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the apartment right now."
    };
  }
}
