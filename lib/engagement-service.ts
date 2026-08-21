import {
  ENGAGEMENT_STATUS,
  ENGAGEMENT_TYPE,
} from "@/lib/booking-advanced-config";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { sendEngagementEmail } from "@/lib/email";
import {
  getRewardCampaignSettings,
  type WinbackStep,
} from "@/lib/reward-campaign-settings";
import { createReengagementVoucher } from "@/lib/voucher-service";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(earlier: Date, later: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function stepDaysFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as { stepDays?: unknown }).stepDays;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Steps already emailed in this inactivity period (since lastActivity). */
function stepsAlreadySent(
  logs: Array<{ metadata: unknown; createdAt: Date }>,
  lastActivity: Date | null,
): Set<number> {
  const sent = new Set<number>();
  for (const log of logs) {
    if (lastActivity && log.createdAt < lastActivity) continue;
    const stepDays = stepDaysFromMetadata(log.metadata);
    // Legacy single-campaign logs had no stepDays — treat as the first historic step (30).
    sent.add(stepDays ?? 30);
  }
  return sent;
}

function nextDueStep(
  steps: WinbackStep[],
  daysInactive: number,
  alreadySent: Set<number>,
): WinbackStep | null {
  for (const step of steps) {
    if (daysInactive < step.days) continue;
    if (alreadySent.has(step.days)) continue;
    return step;
  }
  return null;
}

export async function flagNoShowEngagement(userId: string, bookingId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const existing = await db.engagementLog.findFirst({
    where: {
      userId,
      type: ENGAGEMENT_TYPE.noShow,
      createdAt: { gte: weekAgo },
    },
  });

  if (existing) return existing;

  const log = await db.engagementLog.create({
    data: {
      userId,
      type: ENGAGEMENT_TYPE.noShow,
      status: ENGAGEMENT_STATUS.pending,
      metadata: { bookingId },
    },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (user) {
    await sendEngagementEmail(
      { name: user.name, email: user.email },
      {
        type: ENGAGEMENT_TYPE.noShow,
        message:
          "We missed you in class recently. We hope everything is okay — when you are ready, we would love to see you back at the studio.",
      },
    );

    await db.engagementLog.update({
      where: { id: log.id },
      data: { status: ENGAGEMENT_STATUS.sent, sentAt: new Date() },
    });
  }

  return log;
}

export async function runInactiveMemberEngagement(now = new Date()) {
  const { winbackEnabled, winbackSteps } = await getRewardCampaignSettings();
  if (!winbackEnabled || winbackSteps.length === 0) {
    return { flagged: 0, emailed: 0, checked: 0, skipped: true as const };
  }

  const earliestStepDays = winbackSteps[0]!.days;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - earliestStepDays);

  const users = await db.user.findMany({
    where: {
      accountStatus: "active",
      OR: [{ lastClassAttendedAt: { lt: cutoff } }, { lastClassAttendedAt: null }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      lastClassAttendedAt: true,
      createdAt: true,
      bookings: {
        where: { status: BOOKING_STATUS.confirmed },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, session: { select: { startsAt: true } } },
      },
    },
  });

  let flagged = 0;
  let emailed = 0;

  for (const user of users) {
    const lastActivity =
      user.lastClassAttendedAt ??
      user.bookings[0]?.session.startsAt ??
      user.bookings[0]?.createdAt ??
      null;

    if (lastActivity && lastActivity >= cutoff) {
      continue;
    }

    const inactiveSince = lastActivity ?? user.createdAt;
    const daysInactive = daysBetween(inactiveSince, now);
    if (daysInactive < earliestStepDays) continue;

    const priorLogs = await db.engagementLog.findMany({
      where: {
        userId: user.id,
        type: ENGAGEMENT_TYPE.inactive30Days,
      },
      select: { metadata: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const alreadySent = stepsAlreadySent(priorLogs, lastActivity);
    const step = nextDueStep(winbackSteps, daysInactive, alreadySent);
    if (!step) continue;

    const log = await db.engagementLog.create({
      data: {
        userId: user.id,
        type: ENGAGEMENT_TYPE.inactive30Days,
        status: ENGAGEMENT_STATUS.pending,
        metadata: {
          lastActivity: lastActivity?.toISOString() ?? null,
          stepDays: step.days,
          discountPercent: step.discountPercent,
        },
      },
    });

    flagged += 1;

    const voucher = await createReengagementVoucher(user.id, {
      discountPercent: step.discountPercent,
    });

    await sendEngagementEmail(
      { name: user.name, email: user.email },
      {
        type: ENGAGEMENT_TYPE.inactive30Days,
        message: `We have missed you at Wild Hearts Collective! As a thank-you for coming back, here is ${step.discountPercent}% off your next class.`,
        voucherCode: voucher.code,
      },
    );

    await db.engagementLog.update({
      where: { id: log.id },
      data: { status: ENGAGEMENT_STATUS.sent, sentAt: new Date() },
    });

    emailed += 1;
  }

  return { flagged, emailed, checked: users.length, skipped: false as const };
}

export async function runDailyEngagementJobs() {
  const [{ runFirstLessonFollowUps }] = await Promise.all([
    import("@/lib/class-feedback-service"),
  ]);
  const [inactive, firstLesson] = await Promise.all([
    runInactiveMemberEngagement(),
    runFirstLessonFollowUps(),
  ]);
  return { inactive, firstLesson };
}
