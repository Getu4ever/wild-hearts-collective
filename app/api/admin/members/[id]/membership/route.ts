import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import {
  cancelMemberMembership,
  pauseMemberMembership,
  resumeMemberMembership,
} from "@/lib/membership-actions";
import { MEMBERSHIP_EVENT_TYPE } from "@/lib/profile-config";
import { MEMBERSHIP_PLAN, MEMBERSHIP_STATUS } from "@/lib/membership-config";
import { logAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

type MembershipActionBody = {
  action: "pause" | "resume" | "cancel" | "terminate";
  pauseStart?: string;
  resumeAt?: string | null;
  reason?: string;
  immediate?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.authed) return admin.response;

  const { id } = await context.params;

  let body: MembershipActionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "pause": {
        if (!body.pauseStart) {
          return NextResponse.json({ error: "Pause start date is required." }, { status: 400 });
        }
        await pauseMemberMembership({
          userId: id,
          pauseStart: new Date(body.pauseStart),
          resumeAt: body.resumeAt ? new Date(body.resumeAt) : null,
          createdBy: "admin",
        });
        break;
      }
      case "resume": {
        await resumeMemberMembership({ userId: id, createdBy: "admin" });
        break;
      }
      case "cancel": {
        await cancelMemberMembership({
          userId: id,
          reason: body.reason,
          immediate: false,
          createdBy: "admin",
        });
        break;
      }
      case "terminate": {
        await cancelMemberMembership({
          userId: id,
          reason: body.reason,
          immediate: true,
          createdBy: "admin",
        });
        await db.user.update({
          where: { id },
          data: { membershipStatus: MEMBERSHIP_STATUS.cancelled },
        });
        await db.membershipEvent.create({
          data: {
            userId: id,
            type: MEMBERSHIP_EVENT_TYPE.terminated,
            note: body.reason,
            effectiveAt: new Date(),
            createdBy: "admin",
          },
        });
        await logAdminAction({
          action: "membership.terminated",
          targetUserId: id,
          details: { reason: body.reason ?? null },
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        membershipPlan: true,
        membershipStatus: true,
        membershipRenewsAt: true,
        membershipPausedAt: true,
        membershipResumeAt: true,
        membershipCancelledAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      membership: user
        ? {
            plan: user.membershipPlan,
            status: user.membershipStatus,
            renewsAt: user.membershipRenewsAt?.toISOString() ?? null,
            pausedAt: user.membershipPausedAt?.toISOString() ?? null,
            resumeAt: user.membershipResumeAt?.toISOString() ?? null,
            cancelledAt: user.membershipCancelledAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
