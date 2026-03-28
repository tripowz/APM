import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon
}: StatCardProps) {
  return (
    <article className="surface-panel flex flex-col gap-6 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </span>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-foreground">
          <Icon className="size-5" />
        </div>
      </div>
      {description ? (
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </article>
  );
}
