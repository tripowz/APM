"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

type RealtimeTable =
  | "apartments"
  | "bookings"
  | "expenses"
  | "settings"
  | "users";

type RealtimeRefreshProps = {
  channel: string;
  tables: RealtimeTable[];
};

export function RealtimeRefresh({
  channel,
  tables
}: RealtimeRefreshProps) {
  const router = useRouter();
  const tablesKey = tables.join(",");

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      return;
    }

    const supabase = createClient();
    const tableList = tablesKey.split(",") as RealtimeTable[];
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimeout) {
        return;
      }

      refreshTimeout = setTimeout(() => {
        router.refresh();
        refreshTimeout = null;
      }, 250);
    };

    const realtimeChannel = supabase.channel(channel);

    for (const table of tableList) {
      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table
        },
        scheduleRefresh
      );
    }

    realtimeChannel.subscribe();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      supabase.removeChannel(realtimeChannel);
    };
  }, [channel, router, tablesKey]);

  return null;
}
