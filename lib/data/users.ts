import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  userInviteSchema,
  userProfileUpdateSchema,
  type UserInviteInput
} from "@/lib/validations/user";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function listUsers(): Promise<UserRow[]> {
  const supabase = await createClient();
  const { data: usersResult, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load users: ${error.message}`);
  }

  const users: UserRow[] = usersResult ?? [];

  return users.sort((a: UserRow, b: UserRow) => {
    if (a.role !== b.role) {
      return a.role === "owner" ? -1 : 1;
    }

    return a.full_name.localeCompare(b.full_name);
  });
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const supabase = await createClient();
  const { data: userResult, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }

  return userResult;
}

export async function updateUserProfile(
  id: string,
  input: Partial<{
    full_name: string;
    role: "owner" | "member";
  }>
): Promise<UserRow> {
  const payload: UserUpdate = userProfileUpdateSchema.parse(input);
  const supabase = await createClient();
  const { data: userResult, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return userResult;
}

export async function createManagedUser(
  input: UserInviteInput
): Promise<{
  userId: string;
  temporaryPassword: string;
}> {
  const payload = userInviteSchema.parse(input);
  const admin = createAdminClient();
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const users = usersData?.users ?? [];

  if (listError) {
    throw new Error(`Failed to inspect existing users: ${listError.message}`);
  }

  const existing = users.find((user) => user.email === payload.email);

  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const temporaryPassword = `Apm!${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const { data, error } = await admin.auth.admin.createUser({
    email: payload.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: payload.full_name
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create the user.");
  }

  const profilePayload: UserInsert = {
    id: data.user.id,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role
  };
  const { error: profileError } = await admin.from("users").upsert(profilePayload);

  if (profileError) {
    throw new Error(`Failed to save the user profile: ${profileError.message}`);
  }

  return {
    userId: data.user.id,
    temporaryPassword
  };
}
