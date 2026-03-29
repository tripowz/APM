"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

import {
  createApartment,
  updateApartment
} from "@/lib/data/apartments";
import { resolveLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import {
  createApartmentSchema,
  type ApartmentInput,
  type ApartmentUpdateInput
} from "@/lib/validations/apartment";

type ApartmentRow = Database["public"]["Tables"]["apartments"]["Row"];

export type ApartmentFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const apartmentMetaSchema = z.object({
  apartmentId: z.string().uuid().optional()
});

export async function saveApartmentAction(
  _prevState: ApartmentFormState,
  formData: FormData
): Promise<ApartmentFormState> {
  const locale = resolveLocale(formData.get("locale"));
  const messages = getMessages(locale);
  const metaParsed = apartmentMetaSchema.safeParse({
    apartmentId: formData.get("apartmentId") || undefined
  });
  const parsed = createApartmentSchema(locale).safeParse({
    title: formData.get("title"),
    address: formData.get("address"),
    base_price: formData.get("base_price"),
    status: formData.get("status"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "Kvartira ma'lumotlarini tekshirib, yana urinib ko'ring."
          : "Проверьте данные квартиры и попробуйте снова.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (!metaParsed.success) {
    return {
      error: messages.forms.saveError
    };
  }

  try {
    const apartmentPayload: ApartmentInput = {
      title: parsed.data.title,
      address: parsed.data.address,
      base_price: parsed.data.base_price,
      status: parsed.data.status,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null
    };

    let apartment: ApartmentRow;

    if (metaParsed.data.apartmentId) {
      apartment = await updateApartment(
        metaParsed.data.apartmentId,
        apartmentPayload as ApartmentUpdateInput
      );
    } else {
      apartment = await createApartment(apartmentPayload);
    }

    revalidatePath("/apartments");
    revalidatePath(`/apartments/${apartment.id}`);
    revalidatePath("/dashboard");

    redirect(`/apartments/${apartment.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Kvartirani hozircha saqlab bo'lmadi."
            : "Сейчас не удалось сохранить квартиру."
    };
  }
}
