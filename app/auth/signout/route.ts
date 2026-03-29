import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}
