"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarNavigation } from "@/components/app-shell/app-sidebar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import type { CurrentAppUser } from "@/lib/auth/session";
import { getPageMeta } from "@/lib/navigation";

type AppTopbarProps = {
  currentUser: CurrentAppUser;
  businessName: string;
};

export function AppTopbar({ currentUser, businessName }: AppTopbarProps) {
  const pathname = usePathname();
  const pageMeta = getPageMeta(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const initials = currentUser.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="surface-panel flex min-h-[76px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-sidebar p-4">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">AP</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        APM
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Internal operations
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sidebar-border bg-white p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {currentUser.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                  <SidebarNavigation onNavigate={() => setIsOpen(false)} />
                  <form action="/auth/signout" method="post" className="mt-auto">
                    <Button variant="outline" className="w-full" type="submit">
                      Sign out
                    </Button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {pageMeta.title}
            </span>
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {pageMeta.description}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <StatusBadge tone="success">{businessName}</StatusBadge>
          </div>
          <div className="hidden items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2 sm:flex">
            <div className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-sm font-semibold text-foreground">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {currentUser.fullName}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {currentUser.role}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="hidden sm:block">
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground sm:hidden">
            {initials.slice(0, 1)}
          </div>
        </div>
      </div>
    </header>
  );
}
