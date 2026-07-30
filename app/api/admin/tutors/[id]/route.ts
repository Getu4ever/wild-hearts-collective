import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  getAdminTutor,
  removeAdminTutor,
  updateAdminTutor,
} from "@/lib/admin-session-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const tutor = await getAdminTutor(id);
    if (!tutor) {
      return NextResponse.json({ error: "Instructor not found." }, { status: 404 });
    }
    return NextResponse.json({ tutor });
  } catch (error) {
    console.error("Failed to load tutor:", error);
    return NextResponse.json({ error: "Unable to load instructor." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string | null;
      phone?: string | null;
      bio?: string | null;
      active?: boolean;
    };

    const tutor = await updateAdminTutor(id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      bio: body.bio,
      active: body.active,
    });

    return NextResponse.json({ tutor });
  } catch (error) {
    console.error("Failed to update tutor:", error);
    const message =
      error instanceof Error ? error.message : "Unable to update instructor.";
    const status = message === "Instructor not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const result = await removeAdminTutor(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to remove tutor:", error);
    const message =
      error instanceof Error ? error.message : "Unable to remove instructor.";
    const status = message === "Instructor not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
