import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { getParQStatus, submitParQ, type ParQFormData } from "@/lib/parq-service";

export async function GET() {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const status = await getParQStatus(session.userId);
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const session = await getMemberSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: ParQFormData;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await submitParQ(session.userId, body);
    return NextResponse.json({
      completed: true,
      completedAt: result.parQCompletedAt?.toISOString() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save PAR-Q form.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
