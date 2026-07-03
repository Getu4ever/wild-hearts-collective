import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import {
  removeMemberPaymentMethod,
  setMemberDefaultPaymentMethod,
} from "@/lib/membership-billing";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await setMemberDefaultPaymentMethod(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update payment method.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await removeMemberPaymentMethod(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove payment method.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
