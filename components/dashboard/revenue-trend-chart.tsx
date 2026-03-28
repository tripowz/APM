import { formatCompactNumber, formatCurrency } from "@/lib/formatters";

type RevenueTrendChartProps = {
  data: Array<{
    label: string;
    total: number;
  }>;
  currency: string;
};

export function RevenueTrendChart({
  data,
  currency
}: RevenueTrendChartProps) {
  const maxValue = Math.max(...data.map((item) => item.total), 0);

  if (data.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center text-sm text-muted-foreground">
        Revenue trend data will appear here once bookings are recorded.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid min-h-[220px] grid-cols-6 items-end gap-3 rounded-2xl border border-border bg-surface-muted p-4">
        {data.map((item) => {
          const barHeight = maxValue > 0 ? Math.max((item.total / maxValue) * 100, 8) : 8;

          return (
            <div key={item.label} className="flex h-full flex-col justify-end gap-3">
              <div className="text-center text-xs font-medium text-muted-foreground">
                {item.total > 0 ? formatCompactNumber(item.total) : "0"}
              </div>
              <div className="flex h-40 items-end justify-center">
                <div
                  className="w-full rounded-t-2xl bg-primary shadow-soft transition-all duration-300"
                  style={{ height: `${barHeight}%` }}
                  title={formatCurrency(item.total, currency)}
                />
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Revenue counts full booking value only for bookings in a revenue status
        whose check-in date falls in each month.
      </p>
    </div>
  );
}
