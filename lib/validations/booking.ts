import { z } from "zod";

export const paymentStatusSchema = z.enum(["unpaid", "partial", "paid"]);
export const bookingStatusSchema = z.enum([
  "new",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled"
]);

const bookingBaseSchema = z.object({
  apartment_id: z.string().uuid("Choose a valid apartment."),
  guest_name: z
    .string()
    .trim()
    .min(2, "Guest name must be at least 2 characters.")
    .max(120, "Guest name must be 120 characters or less."),
  guest_phone: z
    .string()
    .trim()
    .max(30, "Phone number must be 30 characters or less.")
    .nullish()
    .transform((value) => value || null),
  check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date is required."),
  check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date is required."),
  total_amount: z.coerce
    .number()
    .nonnegative("Total amount cannot be negative."),
  prepaid_amount: z.coerce
    .number()
    .nonnegative("Prepaid amount cannot be negative.")
    .default(0),
  payment_status: paymentStatusSchema.default("unpaid"),
  booking_status: bookingStatusSchema.default("new"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or less.")
    .nullish()
    .transform((value) => value || null)
});

function withBookingRules<TSchema extends typeof bookingBaseSchema>(schema: TSchema) {
  return schema
    .refine((value) => value.check_out > value.check_in, {
    message: "Check-out must be after check-in.",
    path: ["check_out"]
  })
    .refine((value) => value.prepaid_amount <= value.total_amount, {
      message: "Prepaid amount cannot exceed the total amount.",
      path: ["prepaid_amount"]
    });
}

export const bookingSchema = withBookingRules(bookingBaseSchema);

export const bookingUpdateSchema = bookingBaseSchema.partial();

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
