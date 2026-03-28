import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  settingsSchema,
  type SettingsInput
} from "@/lib/validations/settings";

export async function getSettings() {
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

export async function upsertSettings(input: SettingsInput) {
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
