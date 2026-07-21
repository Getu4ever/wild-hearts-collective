import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { updateAdminClassPack } from "@/lib/studio-pricing-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const payload: Parameters<typeof updateAdminClassPack>[1] = {};

    if (typeof body.name === "string") payload.name = body.name;
    if (typeof body.slug === "string") payload.slug = body.slug;
    if (typeof body.description === "string" || body.description === null) {
      payload.description = body.description;
    }
    if (body.credits != null) {
      payload.credits =
        typeof body.credits === "number"
          ? body.credits
          : Number.parseInt(String(body.credits), 10);
    }
    if (body.pricePounds != null) {
      const pricePounds =
        typeof body.pricePounds === "number"
          ? body.pricePounds
          : Number.parseFloat(String(body.pricePounds));
      if (!Number.isFinite(pricePounds)) {
        return NextResponse.json(
          { error: "Enter a valid pack price." },
          { status: 400 },
        );
      }
      payload.pricePence = Math.round(pricePounds * 100);
    }
    if (body.validDays != null) {
      payload.validDays =
        typeof body.validDays === "number"
          ? body.validDays
          : Number.parseInt(String(body.validDays), 10);
    }
    if (typeof body.active === "boolean") payload.active = body.active;
    if (body.sortOrder != null) {
      payload.sortOrder =
        typeof body.sortOrder === "number"
          ? body.sortOrder
          : Number.parseInt(String(body.sortOrder), 10) || 0;
    }

    const pack = await updateAdminClassPack(id, payload);
    return NextResponse.json({ pack });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update class pack.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
