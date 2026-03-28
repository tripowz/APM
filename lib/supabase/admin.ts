import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  getSupabaseUrl,
  requireServiceRoleKey
} from "@/lib/supabase/env";

const createTypedAdminClient = createClient<Database>;

export type AdminSupabaseClient = ReturnType<typeof createTypedAdminClient>;

export function createAdminClient(): AdminSupabaseClient {
  return createTypedAdminClient(getSupabaseUrl(), requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
