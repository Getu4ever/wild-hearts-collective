import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { pauseMemberMembership } from "@/lib/membership-actions";

type Body = {
  pauseStart?: string;
  resumeAt?: string | null;
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

  const pauseStart = body.pauseStart ? new Date(body.pauseStart) : new Date();
  const resumeAt = body.resumeAt ? new Date(body.resumeAt) : null;

  if (Number.isNaN(pauseStart.getTime())) {
    return NextResponse.json({ error: "Invalid pause start date." }, { status: 400 });
  }

  if (resumeAt && Number.isNaN(resumeAt.getTime())) {
    return NextResponse.json({ error: "Invalid resume date." }, { status: 400 });
  }

  try {
    await pauseMemberMembership({
      userId: session.userId,
      pauseStart,
      resumeAt,
      createdBy: "member",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to pause membership.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
