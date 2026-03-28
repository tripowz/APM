import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { requireServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

export function createAdminClient() {
  return createClient<Database>(supabaseUrl, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
