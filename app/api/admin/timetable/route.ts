import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  getOrSeedMarketingTimetable,
  updateMarketingTimetable,
} from "@/lib/marketing-timetable-service";
import { revalidateMarketingTimetablePages } from "@/lib/revalidate-public-pages";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const result = await getOrSeedMarketingTimetable();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load admin timetable:", error);
    return NextResponse.json(
      { error: "Unable to load timetable." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const daysPayload = Array.isArray(body) ? body : body?.days;
    const result = await updateMarketingTimetable(daysPayload);
    revalidateMarketingTimetablePages();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save timetable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
