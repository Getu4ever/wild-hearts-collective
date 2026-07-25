import { NextResponse } from "next/server";
import { buildIcsCalendarContent } from "@/lib/calendar-links";
import { contact } from "@/lib/site-data";

export const runtime = "nodejs";

const MAX_TEXT = 500;

function clampText(value: string | null, fallback = "") {
  const trimmed = (value ?? fallback).trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_TEXT);
}

function parseIsoDate(value: string | null) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Public ICS download for “Add to calendar” links in booking emails.
 * Opens natively in Apple Calendar / Outlook mobile more reliably than
 * Outlook web compose deeplinks (which force Microsoft login).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clampText(searchParams.get("title"));
  const startsAt = parseIsoDate(searchParams.get("start"));
  const endsAt = parseIsoDate(searchParams.get("end"));
  const description = clampText(searchParams.get("description"));
  const location = clampText(searchParams.get("location"), contact.address);

  if (!title || !startsAt || !endsAt || endsAt.getTime() <= startsAt.getTime()) {
    return new NextResponse("Invalid calendar event", { status: 400 });
  }

  // Cap event length at 12 hours to limit abuse of the public endpoint.
  const maxMs = 12 * 60 * 60 * 1000;
  if (endsAt.getTime() - startsAt.getTime() > maxMs) {
    return new NextResponse("Invalid calendar event", { status: 400 });
  }

  const ics = buildIcsCalendarContent({
    title,
    startsAt,
    endsAt,
    description,
    location,
  });

  const filename = "wild-hearts-booking.ics";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
