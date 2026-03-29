import Link from "next/link";

import {
  BookingStatusBadge,
  PaymentStatusBadge
} from "@/components/bookings/booking-badges";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/messages";
import {
  formatShortDate,
  formatWeekday,
  getCalendarGrid,
  getMonthKey,
  isDateWithinBooking
} from "@/lib/dates";
import type { AppLocale } from "@/lib/types/domain";

type CalendarBooking = {
  id: string;
  apartment_id: string;
  apartment_title: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_status: "new" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  payment_status: "unpaid" | "partial" | "paid";
};

type MonthCalendarProps = {
  monthStart: Date;
  bookings: CalendarBooking[];
  apartmentId?: string;
  locale?: AppLocale;
};

export function MonthCalendar({
  monthStart,
  bookings,
  apartmentId,
  locale = "ru"
}: MonthCalendarProps) {
  const messages = getMessages(locale);
  const grid = getCalendarGrid(monthStart);
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(Date.UTC(2026, 2, 29 + index));
    return formatWeekday(date, locale);
  });
  const monthKey = getMonthKey(monthStart);
  const calendarReturnTo = `/calendar?month=${monthKey}${apartmentId ? `&apartmentId=${apartmentId}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden grid-cols-7 gap-3 lg:grid">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {grid.map((day) => {
          const dayBookings = bookings.filter((booking: CalendarBooking) =>
            isDateWithinBooking(day.iso, booking.check_in, booking.check_out)
          );

          return (
            <div
              key={day.iso}
              className="flex min-h-[168px] flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                    day.isToday
                      ? "bg-primary text-primary-foreground"
                      : day.isCurrentMonth
                        ? "bg-surface-muted text-foreground"
                        : "bg-transparent text-muted-foreground"
                  ].join(" ")}
                >
                  {day.date.getUTCDate()}
                </span>
                {dayBookings.length > 0 ? (
                  <StatusBadge tone="info">{dayBookings.length}</StatusBadge>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                {dayBookings.slice(0, 3).map((booking: CalendarBooking) => (
                  <Link
                    key={`${day.iso}-${booking.id}`}
                    href={`/bookings/${booking.id}/edit?${new URLSearchParams({
                      returnTo: calendarReturnTo
                    }).toString()}`}
                    className="rounded-2xl border border-border bg-surface-muted p-2.5 transition-colors hover:bg-white"
                  >
                    <p className="truncate text-xs font-semibold text-foreground">
                      {booking.guest_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.apartment_title}
                    </p>
                  </Link>
                ))}
                {dayBookings.length > 3 ? (
                  <p className="text-xs text-muted-foreground">
                    +{dayBookings.length - 3} {messages.calendar.moreBookings}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:hidden">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted px-5 py-8 text-center">
            <p className="text-base font-semibold text-foreground">
              {messages.calendar.emptyMonth}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {messages.calendar.emptyMonthDesc}
            </p>
          </div>
        ) : (
          bookings.map((booking: CalendarBooking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}/edit?${new URLSearchParams({
                returnTo: calendarReturnTo
              }).toString()}`}
              className="rounded-2xl border border-border bg-white p-4 shadow-card transition-colors hover:bg-surface-muted"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      {booking.guest_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.apartment_title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BookingStatusBadge status={booking.booking_status} locale={locale} />
                    <PaymentStatusBadge status={booking.payment_status} locale={locale} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatShortDate(booking.check_in, locale)} -{" "}
                  {formatShortDate(booking.check_out, locale)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="flex justify-end lg:hidden">
        <Button asChild size="sm" variant="outline">
          <Link
            href={`/bookings/new?${new URLSearchParams({
              apartmentId: apartmentId ?? "",
              returnTo: calendarReturnTo
            }).toString()}`}
          >
            {messages.calendar.addBooking}
          </Link>
        </Button>
      </div>
    </div>
  );
}
