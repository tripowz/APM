import { StatusBadge } from "@/components/shared/status-badge";
import {
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/i18n/messages";
import type { Database } from "@/lib/supabase/database.types";
import type { AppLocale } from "@/lib/types/domain";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export function BookingStatusBadge({
  status,
  locale = "ru",
}: {
  status: BookingStatus;
  locale?: AppLocale;
}) {
  const tone =
    status === "cancelled"
      ? "danger"
      : status === "checked_out"
        ? "neutral"
        : status === "checked_in"
          ? "success"
          : status === "confirmed"
            ? "info"
            : "warning";

  return <StatusBadge tone={tone}>{getBookingStatusLabel(locale, status)}</StatusBadge>;
}

export function PaymentStatusBadge({
  status,
  locale = "ru",
}: {
  status: PaymentStatus;
  locale?: AppLocale;
}) {
  const tone =
    status === "paid" ? "success" : status === "partial" ? "warning" : "danger";

  return <StatusBadge tone={tone}>{getPaymentStatusLabel(locale, status)}</StatusBadge>;
}
