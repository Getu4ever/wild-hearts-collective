import { NextResponse } from "next/server";
import { getAppBaseUrl, isStripeConfigured } from "@/lib/booking-config";
import { getMemberSession } from "@/lib/member-auth";
import { createBillingPortalSession } from "@/lib/membership-actions";
import { getOrCreateStripeCustomer } from "@/lib/membership-stripe";
import { db } from "@/lib/db";

export async function POST() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Online billing is not configured yet. Please contact the studio." },
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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user);
    const url = await createBillingPortalSession(
      customerId,
      `${getAppBaseUrl()}/account/profile#billing`,
    );

    if (!url) {
      return NextResponse.json(
        { error: "Stripe did not return a billing portal URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to open billing portal.";

    if (message.toLowerCase().includes("billing portal")) {
      return NextResponse.json(
        {
          error:
            "Stripe billing portal is not set up yet. Enable it in your Stripe Dashboard under Settings → Billing → Customer portal.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
