const STATUS_TONES: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-900",
  cancelled: "bg-rose-50 text-rose-800",
  waiting: "bg-sky-50 text-sky-900",
  notified: "bg-violet-50 text-violet-900",
  booked: "bg-emerald-50 text-emerald-800",
};

export function bookingStatusClassName(status: string) {
  return STATUS_TONES[status] ?? "bg-plum/5 text-plum";
}

export function bookingStatusLabel(status: string) {
  if (!status) return "Unknown";
  return status.replaceAll("_", " ");
}
