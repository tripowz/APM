import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-foreground shadow-card">
        <Icon className="size-6" />
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
