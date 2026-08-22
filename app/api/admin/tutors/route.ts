import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";
import {
  createAdminTutor,
  listAdminTutors,
  listAllAdminTutors,
} from "@/lib/admin-session-service";

export async function GET(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.tutors);
  if (!admin.authed) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "1";
    const tutors = includeInactive
      ? await listAllAdminTutors()
      : await listAdminTutors();
    return NextResponse.json({ tutors });
  } catch (error) {
    console.error("Failed to load tutors:", error);
    return NextResponse.json({ error: "Unable to load tutors." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(ADMIN_PERMISSIONS.tutors);
  if (!admin.authed) return admin.response;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string | null;
      phone?: string | null;
      bio?: string | null;
      active?: boolean;
    };

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const tutor = await createAdminTutor({
      name: body.name,
      email: body.email,
      phone: body.phone,
      bio: body.bio,
      active: body.active,
    });

    return NextResponse.json({ tutor }, { status: 201 });
  } catch (error) {
    console.error("Failed to create tutor:", error);
    const message =
      error instanceof Error ? error.message : "Unable to create instructor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
