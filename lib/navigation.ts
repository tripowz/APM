import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  ReceiptText,
  Settings2
} from "lucide-react";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/types/domain";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export function getNavigationItems(locale: AppLocale): NavigationItem[] {
  const messages = getMessages(locale);

  return [
    {
      title: messages.navigation.dashboard.title,
      href: "/dashboard",
      description: messages.navigation.dashboard.description,
      icon: LayoutDashboard
    },
    {
      title: messages.navigation.calendar.title,
      href: "/calendar",
      description: messages.navigation.calendar.description,
      icon: CalendarDays
    },
    {
      title: messages.navigation.apartments.title,
      href: "/apartments",
      description: messages.navigation.apartments.description,
      icon: Building2
    },
    {
      title: messages.navigation.expenses.title,
      href: "/expenses",
      description: messages.navigation.expenses.description,
      icon: ReceiptText
    },
    {
      title: messages.navigation.reports.title,
      href: "/reports",
      description: messages.navigation.reports.description,
      icon: BarChart3
    },
    {
      title: messages.navigation.settings.title,
      href: "/settings",
      description: messages.navigation.settings.description,
      icon: Settings2
    }
  ];
}

export function getPageMeta(pathname: string, locale: AppLocale) {
  const pageMeta = getNavigationItems(locale);

  return (
    pageMeta.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? pageMeta[0]
  );
}
