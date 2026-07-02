import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { WAITLIST_STATUS } from "@/lib/booking-config";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let status = "";

  try {
    const body = await request.json();
    status = typeof body.status === "string" ? body.status : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    status !== WAITLIST_STATUS.waiting &&
    status !== WAITLIST_STATUS.notified &&
    status !== WAITLIST_STATUS.cancelled
  ) {
    return NextResponse.json({ error: "Invalid waitlist status." }, { status: 400 });
  }

  const entry = await db.waitlistEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
  }

  const updated = await db.waitlistEntry.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
  });
}
