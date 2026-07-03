import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { cancelMemberMembership } from "@/lib/membership-actions";

type Body = {
  reason?: string;
  immediate?: boolean;
};

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await cancelMemberMembership({
      userId: session.userId,
      reason: body.reason,
      immediate: Boolean(body.immediate),
      createdBy: "member",
    });

    return NextResponse.json({
      ok: true,
      finalAccessDate: result.finalAccessDate.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel membership.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
