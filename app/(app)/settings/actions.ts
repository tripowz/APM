"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentAppUser } from "@/lib/auth/session";
import { upsertSettings } from "@/lib/data/settings";
import { createManagedUser, updateUserProfile } from "@/lib/data/users";
import { resolveLocale } from "@/lib/i18n/locale";
import { hasServiceRoleKey } from "@/lib/supabase/env";
import { createSettingsSchema } from "@/lib/validations/settings";
import { createUserInviteSchema, userRoleSchema } from "@/lib/validations/user";

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
  const locale = resolveLocale(formData.get("locale"));
  const parsed = createSettingsSchema(locale).safeParse({
    business_name: formData.get("business_name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "Sozlamalarni tekshirib, yana urinib ko'ring."
          : "Проверьте настройки и попробуйте снова.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    await upsertSettings(parsed.data);
    revalidateSettingsRoutes();

    return {
      success:
        locale === "uz"
          ? "Sozlamalar saqlandi."
          : "Настройки сохранены."
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Sozlamalarni hozircha saqlab bo'lmadi."
            : "Сейчас не удалось сохранить настройки."
    };
  }
}

export async function createUserAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const locale = resolveLocale(formData.get("locale"));
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "owner") {
    return {
      error:
        locale === "uz"
          ? "Foydalanuvchilarni faqat egasi qo'sha oladi."
          : "Только владелец может добавлять пользователей."
    };
  }

  if (!hasServiceRoleKey()) {
    return {
      error:
        locale === "uz"
          ? "Ilova ichidan foydalanuvchi qo'shish hozircha yoqilmagan. SUPABASE_SERVICE_ROLE_KEY ni qo'shing yoki foydalanuvchini Supabase Auth ichida yarating."
          : "Добавление пользователей из приложения пока недоступно. Добавьте SUPABASE_SERVICE_ROLE_KEY или создайте пользователя в Supabase Auth."
    };
  }

  const parsed = createUserInviteSchema(locale).safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "Yangi foydalanuvchi ma'lumotlarini tekshirib, yana urinib ko'ring."
          : "Проверьте данные нового пользователя и попробуйте снова.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const result = await createManagedUser(parsed.data);
    revalidateSettingsRoutes();

    return {
      success:
        locale === "uz"
          ? `Foydalanuvchi yaratildi. Vaqtinchalik parol: ${result.temporaryPassword}. Uni xavfsiz tarzda yuboring va birinchi kirishdan keyin almashtirishni so'rang.`
          : `Пользователь создан. Временный пароль: ${result.temporaryPassword}. Передайте его безопасным способом и попросите сменить после первого входа.`
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Foydalanuvchini hozircha yaratib bo'lmadi."
            : "Сейчас не удалось создать пользователя."
    };
  }
}

const createUserRoleFormSchema = () =>
  z.object({
    userId: z.string().uuid(),
    role: userRoleSchema
  });

export async function updateUserRoleAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const locale = resolveLocale(formData.get("locale"));
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "owner") {
    return {
      error:
        locale === "uz"
          ? "Rollarni faqat egasi o'zgartira oladi."
          : "Только владелец может менять роли."
    };
  }

  const parsed = createUserRoleFormSchema().safeParse({
    userId: formData.get("userId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      error:
        locale === "uz"
          ? "To'g'ri rolni tanlab, yana urinib ko'ring."
          : "Выберите корректную роль и попробуйте снова."
    };
  }

  if (parsed.data.userId === currentUser.id) {
    return {
      error:
        locale === "uz"
          ? "Joriy egasining rolini ilova ichidan o'zgartirib bo'lmaydi."
          : "Роль текущего владельца нельзя изменить из интерфейса."
    };
  }

  try {
    await updateUserProfile(parsed.data.userId, {
      role: parsed.data.role
    });
    revalidateSettingsRoutes();

    return {
      success:
        locale === "uz"
          ? "Foydalanuvchi roli yangilandi."
          : "Роль пользователя обновлена."
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : locale === "uz"
            ? "Foydalanuvchi rolini hozircha yangilab bo'lmadi."
            : "Сейчас не удалось обновить роль пользователя."
    };
  }
}

