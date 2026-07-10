import { logAdminAction } from "@/lib/admin-audit";
import { MEMBERSHIP_EVENT_TYPE } from "@/lib/profile-config";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import {
  notifyAdminOfMembershipCancelled,
  notifyAdminOfMembershipPaused,
} from "@/lib/member-notifications";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

async function recordMembershipEvent(input: {
  userId: string;
  type: string;
  note?: string;
  effectiveAt?: Date;
  endsAt?: Date | null;
  createdBy?: string;
}) {
  await db.membershipEvent.create({
    data: {
      userId: input.userId,
      type: input.type,
      note: input.note,
      effectiveAt: input.effectiveAt ?? new Date(),
      endsAt: input.endsAt ?? null,
      createdBy: input.createdBy ?? "member",
    },
  });
}

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function pauseMemberMembership(input: {
  userId: string;
  pauseStart: Date;
  resumeAt?: Date | null;
  createdBy?: string;
}) {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error("Member not found.");

  if (user.membershipStatus === MEMBERSHIP_STATUS.cancelled) {
    throw new Error("Cancelled memberships cannot be paused.");
  }

  if (user.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      pause_collection: { behavior: "mark_uncollectible" },
    });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      membershipStatus: MEMBERSHIP_STATUS.paused,
      membershipPausedAt: input.pauseStart,
      membershipResumeAt: input.resumeAt ?? null,
    },
  });

  await recordMembershipEvent({
    userId: user.id,
    type: MEMBERSHIP_EVENT_TYPE.paused,
    note: input.resumeAt
      ? `Paused until ${input.resumeAt.toISOString()}`
      : "Paused with open-ended resume date",
    effectiveAt: input.pauseStart,
    endsAt: input.resumeAt ?? null,
    createdBy: input.createdBy,
  });

  if (input.createdBy === "admin") {
    await logAdminAction({
      action: "membership.paused",
      targetUserId: user.id,
      details: { pauseStart: input.pauseStart, resumeAt: input.resumeAt ?? null },
    });
  }

  await notifyAdminOfMembershipPaused({
    name: updated.name,
    email: updated.email,
    pausedBy: input.createdBy === "admin" ? "admin" : "member",
    pauseStart: input.pauseStart,
    resumeAt: input.resumeAt ?? null,
  });

  return updated;
}

export async function resumeMemberMembership(input: {
  userId: string;
  createdBy?: string;
}) {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error("Member not found.");

  if (user.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      pause_collection: null,
    });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      membershipStatus: MEMBERSHIP_STATUS.active,
      membershipPausedAt: null,
      membershipResumeAt: null,
    },
  });

  await recordMembershipEvent({
    userId: user.id,
    type: MEMBERSHIP_EVENT_TYPE.resumed,
    createdBy: input.createdBy,
  });

  if (input.createdBy === "admin") {
    await logAdminAction({ action: "membership.resumed", targetUserId: user.id });
  }

  return updated;
}

export async function cancelMemberMembership(input: {
  userId: string;
  reason?: string;
  immediate?: boolean;
  createdBy?: string;
}) {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new Error("Member not found.");

  let finalAccessDate = user.membershipRenewsAt ?? new Date();

  if (user.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();
    if (input.immediate) {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      finalAccessDate = new Date();
    } else {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
  } else if (input.immediate) {
    finalAccessDate = new Date();
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      membershipStatus: input.immediate
        ? MEMBERSHIP_STATUS.cancelled
        : user.membershipStatus,
      membershipCancelledAt: new Date(),
      cancellationReason: input.reason?.trim() || null,
      stripeSubscriptionId: input.immediate ? null : user.stripeSubscriptionId,
      membershipPlan: input.immediate ? MEMBERSHIP_PLAN.account : user.membershipPlan,
      membershipRenewsAt: input.immediate ? null : user.membershipRenewsAt,
    },
  });

  await recordMembershipEvent({
    userId: user.id,
    type: MEMBERSHIP_EVENT_TYPE.cancelled,
    note: input.reason,
    endsAt: finalAccessDate,
    createdBy: input.createdBy,
  });

  if (input.createdBy === "admin") {
    await logAdminAction({
      action: "membership.cancelled",
      targetUserId: user.id,
      details: { immediate: Boolean(input.immediate), reason: input.reason ?? null },
    });
  }

  await notifyAdminOfMembershipCancelled({
    name: updated.name,
    email: updated.email,
    cancelledBy: input.createdBy === "admin" ? "admin" : "member",
    reason: input.reason,
    immediate: Boolean(input.immediate),
    finalAccessDate,
  });

  return { user: updated, finalAccessDate };
}

export async function getMembershipTimeline(userId: string) {
  return db.membershipEvent.findMany({
    where: { userId },
    orderBy: { effectiveAt: "desc" },
  });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
