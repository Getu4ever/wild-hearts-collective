import { contact } from "@/lib/site-data";
import { getAppBaseUrl } from "@/lib/booking-config";

export type CalendarEventInput = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  location?: string;
};

function toGoogleUtcStamp(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Fold ICS content lines per RFC 5545 (§3.1). */
function foldIcsLine(line: string) {
  const limit = 75;
  if (line.length <= limit) return line;

  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, limit));
  remaining = remaining.slice(limit);
  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, limit - 1)}`);
    remaining = remaining.slice(limit - 1);
  }
  return parts.join("\r\n");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** Google Calendar “add event” deep link. */
export function buildGoogleCalendarUrl(event: CalendarEventInput) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleUtcStamp(event.startsAt)}/${toGoogleUtcStamp(event.endsAt)}`,
    details: event.description ?? "",
    location: event.location ?? contact.address,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * @deprecated Prefer buildCalendarIcsUrl — Outlook web compose opens a Microsoft
 * login page on mobile instead of the Outlook app.
 */
export function buildOutlookCalendarUrl(event: CalendarEventInput) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.startsAt.toISOString(),
    enddt: event.endsAt.toISOString(),
    body: event.description ?? "",
    location: event.location ?? contact.address,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Build a VCALENDAR/VEVENT body (UTC times) for Apple Calendar, Outlook, etc. */
export function buildIcsCalendarContent(event: CalendarEventInput) {
  const uid = `whc-${toGoogleUtcStamp(event.startsAt)}-${Math.abs(
    hashString(event.title),
  )}@wildheartscollective.org`;
  const dtStamp = toGoogleUtcStamp(new Date());
  const dtStart = toGoogleUtcStamp(event.startsAt);
  const dtEnd = toGoogleUtcStamp(event.endsAt);
  const location = event.location ?? contact.address;
  const description = event.description ?? "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wild Hearts Collective//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

/** Hosted ICS download URL for booking confirmation emails. */
export function buildCalendarIcsUrl(
  event: CalendarEventInput,
  baseUrl = getAppBaseUrl(),
) {
  const params = new URLSearchParams({
    title: event.title,
    start: event.startsAt.toISOString(),
    end: event.endsAt.toISOString(),
    description: event.description ?? "",
    location: event.location ?? contact.address,
  });
  return `${baseUrl}/api/calendar/ics?${params.toString()}`;
}

export function resolveSessionEndsAt(
  startsAt: Date,
  endsAt?: Date | null,
  durationMinutes = 60,
) {
  if (endsAt) return endsAt;
  return new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}
