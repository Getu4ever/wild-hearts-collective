import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  getOrSeedMarketingTimetable,
  setMarketingTimetableVisibility,
  updateMarketingTimetable,
} from "@/lib/marketing-timetable-service";
import { revalidateMarketingTimetablePages } from "@/lib/revalidate-public-pages";

export async function GET() {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.timetable);
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
  const admin = await requireAdmin(ADMIN_PERMISSIONS.timetable);
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const daysPayload = Array.isArray(body) ? body : body?.days;
    const hasVisibility = typeof body?.visible === "boolean";

    let result;
    if (daysPayload !== undefined) {
      result = await updateMarketingTimetable(daysPayload);
    } else {
      result = await getOrSeedMarketingTimetable();
    }

    if (hasVisibility) {
      const visible = await setMarketingTimetableVisibility(body.visible === true);
      result = { ...result, visible };
    }

    revalidateMarketingTimetablePages();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save timetable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
