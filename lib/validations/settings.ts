import { z } from "zod";

export const settingsSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(120, "Business name must be 120 characters or less."),
  currency: z
    .string()
    .trim()
    .min(3, "Currency should use a short code like USD.")
    .max(8, "Currency code is too long.")
    .default("USD"),
  timezone: z
    .string()
    .trim()
    .min(2, "Timezone is required.")
    .max(80, "Timezone value is too long.")
});

export type SettingsInput = z.infer<typeof settingsSchema>;
