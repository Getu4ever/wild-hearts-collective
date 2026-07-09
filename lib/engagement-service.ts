import {
  ENGAGEMENT_STATUS,
  ENGAGEMENT_TYPE,
  INACTIVITY_DAYS,
} from "@/lib/booking-advanced-config";
import { BOOKING_STATUS } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { sendEngagementEmail } from "@/lib/email";
import { createReengagementVoucher } from "@/lib/voucher-service";

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
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - INACTIVITY_DAYS);

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

    const recentLog = await db.engagementLog.findFirst({
      where: {
        userId: user.id,
        type: ENGAGEMENT_TYPE.inactive30Days,
        createdAt: { gte: cutoff },
      },
    });

    if (recentLog) continue;

    const log = await db.engagementLog.create({
      data: {
        userId: user.id,
        type: ENGAGEMENT_TYPE.inactive30Days,
        status: ENGAGEMENT_STATUS.pending,
        metadata: { lastActivity: lastActivity?.toISOString() ?? null },
      },
    });

    flagged += 1;

    const voucher = await createReengagementVoucher(user.id);

    await sendEngagementEmail(
      { name: user.name, email: user.email },
      {
        type: ENGAGEMENT_TYPE.inactive30Days,
        message:
          "We have missed you at Wild Hearts Collective! Here is a little incentive to come back and move with us again.",
        voucherCode: voucher.code,
      },
    );

    await db.engagementLog.update({
      where: { id: log.id },
      data: { status: ENGAGEMENT_STATUS.sent, sentAt: new Date() },
    });

    emailed += 1;
  }

  return { flagged, emailed, checked: users.length };
}

export async function runDailyEngagementJobs() {
  const inactive = await runInactiveMemberEngagement();
  return { inactive };
}
