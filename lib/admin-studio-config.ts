import { UK_TIMEZONE } from "@/lib/booking-config";

export const SESSION_STATUS = {
  scheduled: "scheduled",
  cancelled: "cancelled",
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const CLASS_TYPE_OPTIONS = [
  {
    slug: "pole",
    label: "Pole",
    title: "Pole Dancing",
    maxCapacity: 12,
    defaultDuration: 60,
  },
  {
    slug: "aerial-hoop",
    label: "Hoop",
    title: "Aerial Hoop",
    maxCapacity: 10,
    defaultDuration: 60,
  },
  {
    slug: "aerial-silks",
    label: "Silks",
    title: "Aerial Silks",
    maxCapacity: 10,
    defaultDuration: 60,
  },
  {
    slug: "creative-arts-workshops",
    label: "Creative Arts",
    title: "Creative Arts Workshops",
    maxCapacity: 15,
    defaultDuration: 90,
  },
] as const;

export type ClassTypeSlug = (typeof CLASS_TYPE_OPTIONS)[number]["slug"];

export function getClassTypeOption(slug: string) {
  return CLASS_TYPE_OPTIONS.find((option) => option.slug === slug);
}

export function getMaxCapacityForClassSlug(slug: string) {
  return getClassTypeOption(slug)?.maxCapacity ?? 12;
}

export function clampCapacity(slug: string, capacity: number) {
  const max = getMaxCapacityForClassSlug(slug);
  return Math.min(Math.max(1, Math.round(capacity)), max);
}

export function computeEndsAt(startsAt: Date, durationMinutes: number) {
  return new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
}

export type OccupancyLevel = "open" | "near" | "full" | "cancelled";

export function getOccupancyLevel(
  confirmed: number,
  capacity: number,
  status: string = SESSION_STATUS.scheduled,
): OccupancyLevel {
  if (status === SESSION_STATUS.cancelled) return "cancelled";
  if (confirmed >= capacity) return "full";
  if (confirmed >= Math.max(1, Math.ceil(capacity * 0.8))) return "near";
  return "open";
}

export function occupancyLabel(confirmed: number, capacity: number) {
  return `${confirmed}/${capacity} slots filled`;
}

export function occupancyBadgeClass(level: OccupancyLevel) {
  switch (level) {
    case "full":
      return "bg-brand/15 text-brand border-brand/25";
    case "near":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "cancelled":
      return "bg-plum/10 text-muted border-plum/15 line-through";
    default:
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
  }
}

export function formatSessionTimeRange(startsAt: Date, endsAt?: Date | null) {
  const start = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startsAt);

  if (!endsAt) return start;

  const end = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(endsAt);

  return `${start}–${end}`;
}

export const DEFAULT_TUTORS = [
  { name: "Rosie", email: null, bio: "Co-founder & pole instructor" },
  { name: "Jacqui", email: null, bio: "Co-founder & aerial instructor" },
  { name: "Sarah", email: null, bio: "Aerial instructor" },
] as const;
