import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CurrentAppUser = {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "member";
};

type UserProfileRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "email" | "full_name" | "role"
>;

export const getCurrentAppUser = cache(async (): Promise<CurrentAppUser | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError) {
    return null;
  }

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

  const { data: profileResult, error: profileError } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load user profile: ${profileError.message}`);
  }

  if (!profileResult) {
    return {
      id: userId,
      email,
      fullName: fullNameFromClaims,
      role: "member"
    };
  }

  const profile: UserProfileRow = profileResult;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role
  };
});

export async function requireAuthenticatedUser(): Promise<CurrentAppUser> {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentAppUser();

  if (user) {
    redirect("/dashboard");
  }
}
