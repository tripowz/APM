import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import {
  getSupabasePublishableKey,
  getSupabaseUrl
} from "@/lib/supabase/env";

const createTypedBrowserClient = createBrowserClient<Database>;

export type BrowserSupabaseClient = ReturnType<typeof createTypedBrowserClient>;

export function createClient(): BrowserSupabaseClient {
  return createTypedBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey()
  );
}
