import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  settingsSchema,
  type SettingsInput
} from "@/lib/validations/settings";

export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

export async function getSettings(): Promise<SettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  return data;
}

export async function upsertSettings(input: SettingsInput): Promise<SettingsRow> {
  const payload = settingsSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .upsert({ id: 1, ...payload })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }

  return data;
}
