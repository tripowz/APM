"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex max-w-lg flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong in this workspace
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          The page could not finish loading. Try again, and if the problem
          continues, review the latest server-side change or Supabase response.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
