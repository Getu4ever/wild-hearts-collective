import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getMemberSession } from "@/lib/member-auth";
import { createMemberSubscriptionIntent } from "@/lib/membership-billing";
import { db } from "@/lib/db";

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

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      membershipPlan: true,
      membershipStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (user.membershipPlan === "monthly" && user.membershipStatus === "active") {
    return NextResponse.json(
      { error: "You already have an active monthly membership." },
      { status: 409 },
    );
  }

  try {
    const result = await createMemberSubscriptionIntent(session.userId);
    return NextResponse.json({
      clientSecret: result.clientSecret,
      subscriptionId: result.subscriptionId,
      embedded: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start membership payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
