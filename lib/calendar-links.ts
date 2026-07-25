import { contact } from "@/lib/site-data";

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

/** Outlook.com / Outlook web “add event” deep link. */
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

export function resolveSessionEndsAt(
  startsAt: Date,
  endsAt?: Date | null,
  durationMinutes = 60,
) {
  if (endsAt) return endsAt;
  return new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
}
