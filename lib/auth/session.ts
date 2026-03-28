import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentAppUser = {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "member";
};

export const getCurrentAppUser = cache(async (): Promise<CurrentAppUser | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const userId = claims?.sub;
  const email = typeof claims?.email === "string" ? claims.email : null;
  const fullNameFromClaims =
    claims &&
    typeof claims === "object" &&
    "user_metadata" in claims &&
    claims.user_metadata &&
    typeof claims.user_metadata === "object" &&
    "full_name" in claims.user_metadata &&
    typeof claims.user_metadata.full_name === "string"
      ? claims.user_metadata.full_name
      : email?.split("@")[0] ?? "User";

  if (!userId || !email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return {
      id: userId,
      email,
      fullName: fullNameFromClaims,
      role: "member"
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role
  };
});

export async function requireAuthenticatedUser() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentAppUser();

  if (user) {
    redirect("/dashboard");
  }
}
