import { z } from "zod";

export const apartmentStatusSchema = z.enum(["active", "inactive"]);

export const apartmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Apartment title must be at least 2 characters.")
    .max(140, "Apartment title must be 140 characters or less."),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(240, "Address must be 240 characters or less."),
  base_price: z.coerce
    .number()
    .nonnegative("Base price cannot be negative."),
  status: apartmentStatusSchema.default("active"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or less.")
    .nullish()
    .transform((value) => value || null)
});

export const apartmentUpdateSchema = apartmentSchema.partial();

export type ApartmentInput = z.infer<typeof apartmentSchema>;
export type ApartmentUpdateInput = z.infer<typeof apartmentUpdateSchema>;
