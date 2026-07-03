import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";
import { syncMemberSubscription } from "@/lib/membership-billing";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { subscriptionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.subscriptionId) {
    return NextResponse.json({ error: "Subscription ID is required." }, { status: 400 });
  }

  try {
    const result = await syncMemberSubscription(session.userId, body.subscriptionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync membership.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
