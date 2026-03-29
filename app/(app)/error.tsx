"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const LOCALE_COOKIE_NAME = "apm_locale";

function readLocaleFromCookie(): AppLocale {
  if (typeof document === "undefined") {
    return "ru";
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`));

  return cookie?.split("=")[1] === "uz" ? "uz" : "ru";
}

export default function AppError({ error, reset }: AppErrorProps) {
  const [locale, setLocale] = useState<AppLocale>("ru");
  const messages = getMessages(locale);

  useEffect(() => {
    console.error(error);
    setLocale(readLocaleFromCookie());
  }, [error]);

  const title =
    locale === "uz"
      ? "Sahifani ochib bo'lmadi"
      : "Не удалось открыть страницу";
  const description =
    locale === "uz"
      ? "Sahifani yangilab ko'ring. Agar muammo takrorlansa, Supabase ulanishi va so'nggi o'zgarishlarni tekshiring."
      : "Попробуйте обновить страницу. Если ошибка повторяется, проверьте подключение к Supabase и последние изменения на сервере.";
  const retryLabel = locale === "uz" ? "Qayta urinish" : "Попробовать снова";

  return (
    <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex max-w-lg flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <Button onClick={reset}>{retryLabel}</Button>
    </div>
  );
}
