import { StatusBadge } from "@/components/shared/status-badge";
import type { Database } from "@/lib/supabase/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
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

  return <StatusBadge tone={tone}>{status.replace("_", " ")}</StatusBadge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid" ? "success" : status === "partial" ? "warning" : "danger";

  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}
