import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { resumeMemberMembership } from "@/lib/membership-actions";

export async function POST() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  try {
    await resumeMemberMembership({ userId: session.userId, createdBy: "member" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resume membership.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
