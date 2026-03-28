"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavigationProps = {
  className?: string;
  onNavigate?: () => void;
};

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavigation({
  className,
  onNavigate
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navigationItems.map((item) => {
        const isActive = isRouteActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border transition-colors duration-200",
                isActive
                  ? "border-white/10 bg-white/10 text-primary-foreground"
                  : "border-sidebar-border bg-white text-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {item.title}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  isActive ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[296px] shrink-0 px-5 py-5 lg:block">
      <div className="flex h-full flex-col rounded-[28px] border border-sidebar-border bg-sidebar p-4 shadow-soft">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">APM</span>
            <span className="text-xs text-muted-foreground">
              Internal operations
            </span>
          </div>
        </div>

        <div className="hairline my-4" />

        <SidebarNavigation className="flex-1" />

        <div className="hairline my-4" />

        <div className="surface-panel flex flex-col gap-2 p-4">
          <span className="text-sm font-semibold text-foreground">
            Internal MVP
          </span>
          <p className="text-sm leading-6 text-muted-foreground">
            Built for one apartment business with simple auth, practical reporting, and room for realtime updates.
          </p>
        </div>
      </div>
    </aside>
  );
}
