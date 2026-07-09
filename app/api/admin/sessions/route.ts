import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  createAdminSession,
  listAdminSessions,
} from "@/lib/admin-session-service";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "42");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const now = new Date();
    const sessions = await listAdminSessions({
      from: from ? new Date(from) : now,
      to: to
        ? new Date(to)
        : new Date(now.getTime() + 1000 * 60 * 60 * 24 * Math.min(days, 90)),
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to list admin sessions:", error);
    return NextResponse.json(
      { error: "Unable to load schedule." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const classSlug = typeof body.classSlug === "string" ? body.classSlug : "";
    const date = typeof body.date === "string" ? body.date : "";
    const startTime = typeof body.startTime === "string" ? body.startTime : "";
    const endTime = typeof body.endTime === "string" ? body.endTime : undefined;
    const capacity = Number(body.capacity);
    const tutorId =
      typeof body.tutorId === "string" && body.tutorId ? body.tutorId : null;
    const adminNotes =
      typeof body.adminNotes === "string" ? body.adminNotes : undefined;

    if (!classSlug || !date || !startTime || !Number.isFinite(capacity)) {
      return NextResponse.json(
        { error: "Class type, date, start time, and capacity are required." },
        { status: 400 },
      );
    }

    const session = await createAdminSession({
      classSlug,
      date,
      startTime,
      endTime,
      capacity,
      tutorId,
      adminNotes,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
