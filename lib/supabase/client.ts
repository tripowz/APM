import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import {
  supabasePublishableKey,
  supabaseUrl
} from "@/lib/supabase/env";

export type BrowserSupabaseClient = ReturnType<
  typeof createBrowserClient<Database>
>;

export function createClient(): BrowserSupabaseClient {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
