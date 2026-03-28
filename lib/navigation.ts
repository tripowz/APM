import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  ReceiptText,
  Settings2
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Portfolio overview",
    icon: LayoutDashboard
  },
  {
    title: "Calendar",
    href: "/calendar",
    description: "Bookings and turnover",
    icon: CalendarDays
  },
  {
    title: "Apartments",
    href: "/apartments",
    description: "Inventory and status",
    icon: Building2
  },
  {
    title: "Expenses",
    href: "/expenses",
    description: "Costs and categories",
    icon: ReceiptText
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Operational summaries",
    icon: BarChart3
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Business preferences",
    icon: Settings2
  }
];

const pageMeta = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Overview, activity, and core operating signals"
  },
  {
    href: "/calendar",
    title: "Calendar",
    description: "Reservation timing and apartment availability"
  },
  {
    href: "/bookings",
    title: "Bookings",
    description: "Create, edit, and manage reservations"
  },
  {
    href: "/apartments",
    title: "Apartments",
    description: "Inventory details and apartment readiness"
  },
  {
    href: "/expenses",
    title: "Expenses",
    description: "Internal spend tracking and visibility"
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Performance summaries and export-ready views"
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Workspace defaults and future integrations"
  }
];

export function getPageMeta(pathname: string) {
  return (
    pageMeta.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? pageMeta[0]
  );
}
