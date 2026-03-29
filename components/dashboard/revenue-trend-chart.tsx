import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import { formatMonthLabel, parseIsoDate } from "@/lib/dates";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale, DisplayCurrency } from "@/lib/types/domain";

type RevenueTrendChartProps = {
  data: Array<{
    label: string;
    total: number;
  }>;
  currency: DisplayCurrency;
  locale?: AppLocale;
};

function formatTrendLabel(label: string, locale: AppLocale) {
  if (/^\d{4}-\d{2}$/.test(label)) {
    return formatMonthLabel(parseIsoDate(`${label}-01`), locale);
  }

  return label;
}

export function RevenueTrendChart({
  data,
  currency,
  locale = "ru"
}: RevenueTrendChartProps) {
  const messages = getMessages(locale);
  const maxValue = Math.max(...data.map((item) => item.total), 0);

  if (data.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center text-sm text-muted-foreground">
        {messages.dashboard.noRecentBookings}
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
                {item.total > 0 ? formatCompactNumber(item.total, locale) : "0"}
              </div>
              <div className="flex h-40 items-end justify-center">
                <div
                  className="w-full rounded-t-2xl bg-primary shadow-soft transition-all duration-300"
                  style={{ height: `${barHeight}%` }}
                  title={formatCurrency(item.total, currency, locale)}
                />
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                {formatTrendLabel(item.label, locale)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {messages.dashboard.revenueTrendDesc}
      </p>
    </div>
  );
}
