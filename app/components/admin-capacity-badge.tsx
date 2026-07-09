import {
  getOccupancyLevel,
  occupancyBadgeClass,
  occupancyLabel,
  type OccupancyLevel,
} from "@/lib/admin-studio-config";

export function AdminCapacityBadge({
  confirmed,
  capacity,
  status = "scheduled",
}: {
  confirmed: number;
  capacity: number;
  status?: string;
}) {
  const level = getOccupancyLevel(confirmed, capacity, status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${occupancyBadgeClass(level)}`}
    >
      {occupancyLabel(confirmed, capacity)}
    </span>
  );
}

export function occupancyBarClass(level: OccupancyLevel) {
  switch (level) {
    case "full":
      return "bg-brand";
    case "near":
      return "bg-amber-500";
    case "cancelled":
      return "bg-sage/20";
    default:
      return "bg-emerald-500";
  }
}
