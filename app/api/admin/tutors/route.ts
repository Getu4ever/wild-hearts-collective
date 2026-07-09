import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { listAdminTutors } from "@/lib/admin-session-service";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const tutors = await listAdminTutors();
    return NextResponse.json({ tutors });
  } catch (error) {
    console.error("Failed to load tutors:", error);
    return NextResponse.json({ error: "Unable to load tutors." }, { status: 503 });
  }
}
