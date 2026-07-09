import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  forceBookAsAdmin,
  searchMembersForBooking,
} from "@/lib/admin-booking-service";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const members = await searchMembersForBooking(query);
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to search members:", error);
    return NextResponse.json({ error: "Unable to search members." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const name = typeof body.name === "string" ? body.name : "";
    const email = typeof body.email === "string" ? body.email : "";
    const userId = typeof body.userId === "string" ? body.userId : undefined;
    const phone = typeof body.phone === "string" ? body.phone : undefined;
    const notes = typeof body.notes === "string" ? body.notes : undefined;
    const deductCredit = body.deductCredit === true;

    if (!sessionId || (!userId && (!name || !email))) {
      return NextResponse.json(
        { error: "Session and student details are required." },
        { status: 400 },
      );
    }

    const result = await forceBookAsAdmin({
      sessionId,
      userId,
      name,
      email,
      phone,
      notes,
      deductCredit,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
