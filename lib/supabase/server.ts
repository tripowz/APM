import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/supabase/database.types";
import {
  getSupabasePublishableKey,
  getSupabaseUrl
} from "@/lib/supabase/env";

const createTypedServerClient = createServerClient<Database>;

export type ServerSupabaseClient = ReturnType<typeof createTypedServerClient>;

export async function createClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createTypedServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies. Middleware refreshes sessions.
          }
        }
      }
    }
  );
}
