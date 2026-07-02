import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/booking-config";
import { getMemberSession } from "@/lib/member-auth";
import { createMembershipCheckoutSession } from "@/lib/membership-stripe";
import { db } from "@/lib/db";

export async function POST() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online membership payments are not configured yet." },
      { status: 503 },
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
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

  const checkout = await createMembershipCheckoutSession(user);

  return NextResponse.json({ checkoutUrl: checkout.url });
}
