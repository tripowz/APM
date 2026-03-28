"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentAppUser } from "@/lib/auth/session";
import { upsertSettings } from "@/lib/data/settings";
import { createManagedUser, updateUserProfile } from "@/lib/data/users";
import { hasServiceRoleKey } from "@/lib/supabase/env";
import { settingsSchema } from "@/lib/validations/settings";
import { userInviteSchema, userRoleSchema } from "@/lib/validations/user";

export type SettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function revalidateSettingsRoutes() {
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function saveWorkspaceSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const parsed = settingsSchema.safeParse({
    business_name: formData.get("business_name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone")
  });

  if (!parsed.success) {
    return {
      error: "Review the workspace settings and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await upsertSettings(parsed.data);
    revalidateSettingsRoutes();

    return {
      success: "Workspace settings saved."
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save workspace settings right now."
    };
  }
}

export async function createUserAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "owner") {
    return {
      error: "Only the owner can add users."
    };
  }

  if (!hasServiceRoleKey()) {
    return {
      error:
        "In-app user creation is disabled. Add SUPABASE_SERVICE_ROLE_KEY to enable it, or create the user directly in Supabase Auth."
    };
  }

  const parsed = userInviteSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      error: "Review the new user details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const result = await createManagedUser(parsed.data);
    revalidateSettingsRoutes();

    return {
      success: `User created. Temporary password: ${result.temporaryPassword}. Share it securely and ask the user to change it after first sign-in.`
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the user right now."
    };
  }
}

const userRoleFormSchema = z.object({
  userId: z.string().uuid(),
  role: userRoleSchema
});

export async function updateUserRoleAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "owner") {
    return {
      error: "Only the owner can update user roles."
    };
  }

  const parsed = userRoleFormSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      error: "Choose a valid role and try again."
    };
  }

  if (parsed.data.userId === currentUser.id) {
    return {
      error: "Change another user first. The current owner role stays fixed in-app for this MVP."
    };
  }

  try {
    await updateUserProfile(parsed.data.userId, {
      role: parsed.data.role
    });
    revalidateSettingsRoutes();

    return {
      success: "User role updated."
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the user role right now."
    };
  }
}
