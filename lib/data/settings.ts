import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  toTableRow,
  toMaybeTableRow,
  toSupabaseUpsert,
} from "@/lib/supabase/tables";
import {
  settingsSchema,
  type SettingsInput
} from "@/lib/validations/settings";

export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];
type SettingsInsert = Database["public"]["Tables"]["settings"]["Insert"];

export async function getSettings(): Promise<SettingsRow | null> {
  const supabase = await createClient();
  const { data: settingsResult, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  return toMaybeTableRow<"settings">(settingsResult);
}

export async function upsertSettings(input: SettingsInput): Promise<SettingsRow> {
  const payload: SettingsInsert = settingsSchema.parse(input);
  const settingsPayload: SettingsInsert = { id: 1, ...payload };
  const supabase = await createClient();
  const { data: settingsResult, error } = await supabase
    .from("settings")
    .upsert(toSupabaseUpsert<"settings">(settingsPayload))
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }

  return toTableRow<"settings">(settingsResult);
}
