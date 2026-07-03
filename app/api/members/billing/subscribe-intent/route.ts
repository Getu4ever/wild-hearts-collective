import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getMemberSession } from "@/lib/member-auth";
import { createMemberSubscriptionIntent } from "@/lib/membership-billing";

export async function POST() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isStripeConfigured() || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: "Online membership payments are not configured yet." },
      { status: 503 },
    );
  }

  try {
    const result = await createMemberSubscriptionIntent(session.userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start membership payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
