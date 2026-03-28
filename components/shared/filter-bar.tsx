import { Button } from "@/components/ui/button";

type FilterItem = {
  label: string;
  active?: boolean;
};

type FilterBarProps = {
  items: FilterItem[];
  children?: React.ReactNode;
};

export function FilterBar({ items, children }: FilterBarProps) {
  return (
    <section className="surface-panel flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "default" : "secondary"}
            size="sm"
            className={item.active ? "" : "text-muted-foreground"}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </section>
  );
}
