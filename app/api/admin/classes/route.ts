import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { CLASS_TYPE_OPTIONS } from "@/lib/admin-studio-config";
import {
  listAdminClasses,
  upsertAdminClass,
} from "@/lib/admin-session-service";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const classes = await listAdminClasses();
    return NextResponse.json({
      classes,
      classTypes: CLASS_TYPE_OPTIONS,
    });
  } catch (error) {
    console.error("Failed to load classes:", error);
    return NextResponse.json({ error: "Unable to load classes." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug : "";
    const title = typeof body.title === "string" ? body.title : "";
    const description =
      typeof body.description === "string" ? body.description : "";

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required." },
        { status: 400 },
      );
    }

    const classRecord = await upsertAdminClass({
      slug,
      title,
      description,
      duration: Number(body.duration) || 60,
      maxCapacity: Number(body.maxCapacity) || 12,
    });

    return NextResponse.json({ class: classRecord }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
