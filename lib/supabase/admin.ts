import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { requireServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

export type AdminSupabaseClient = ReturnType<typeof createClient<Database>>;

export function createAdminClient(): AdminSupabaseClient {
  return createClient<Database>(supabaseUrl, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
