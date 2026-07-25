import { randomBytes } from "crypto";
import {
  ATTENDANCE_STATUS,
  ENGAGEMENT_STATUS,
  ENGAGEMENT_TYPE,
} from "@/lib/booking-advanced-config";
import { BOOKING_STATUS, getAppBaseUrl } from "@/lib/booking-config";
import { db } from "@/lib/db";
import { sendFirstLessonFeedbackEmail } from "@/lib/email";

function feedbackClient() {
  if (!("classFeedback" in db) || !db.classFeedback) {
    throw new Error(
      "Class feedback is not ready. Run `npx prisma generate && npm run db:sync`.",
    );
  }
  return db.classFeedback;
}

/**
 * After a student's first attended class, invite them to leave feedback.
 * Designed to run from the daily engagement cron.
 */
export async function runFirstLessonFollowUps(now = new Date()) {
  const windowEnd = new Date(now);
  windowEnd.setHours(windowEnd.getHours() - 6);
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 5);

  const candidates = await db.booking.findMany({
    where: {
      status: BOOKING_STATUS.confirmed,
      attendance: ATTENDANCE_STATUS.attended,
      session: {
        startsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      classFeedback: null,
    },
    include: {
      session: { include: { class: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  let emailed = 0;
  let skipped = 0;

  for (const booking of candidates) {
    const priorAttended = await db.booking.count({
      where: {
        id: { not: booking.id },
        attendance: ATTENDANCE_STATUS.attended,
        status: BOOKING_STATUS.confirmed,
        OR: [
          ...(booking.userId ? [{ userId: booking.userId }] : []),
          { email: booking.email.toLowerCase() },
        ],
      },
    });

    if (priorAttended > 0) {
      skipped += 1;
      continue;
    }

    if (booking.userId) {
      const existingEngagement = await db.engagementLog.findFirst({
        where: {
          userId: booking.userId,
          type: ENGAGEMENT_TYPE.firstLessonFollowUp,
        },
      });
      if (existingEngagement) {
        skipped += 1;
        continue;
      }
    }

    const token = randomBytes(24).toString("hex");
    const feedback = await feedbackClient().create({
      data: {
        token,
        bookingId: booking.id,
        userId: booking.userId,
        email: booking.email.toLowerCase(),
        name: booking.name,
        classTitle: booking.session.class.title,
        sessionStartsAt: booking.session.startsAt,
      },
    });

    let engagementId: string | null = null;
    if (booking.userId) {
      const log = await db.engagementLog.create({
        data: {
          userId: booking.userId,
          type: ENGAGEMENT_TYPE.firstLessonFollowUp,
          status: ENGAGEMENT_STATUS.pending,
          metadata: {
            bookingId: booking.id,
            feedbackId: feedback.id,
          },
        },
      });
      engagementId = log.id;
    }

    const feedbackUrl = `${getAppBaseUrl()}/feedback/${feedback.token}`;

    await sendFirstLessonFeedbackEmail(
      { name: booking.name, email: booking.email },
      {
        classTitle: booking.session.class.title,
        startsAt: booking.session.startsAt,
        feedbackUrl,
      },
    );

    if (engagementId) {
      await db.engagementLog.update({
        where: { id: engagementId },
        data: { status: ENGAGEMENT_STATUS.sent, sentAt: new Date() },
      });
    }

    emailed += 1;
  }

  return { emailed, skipped, checked: candidates.length };
}

export async function getFeedbackByToken(token: string) {
  return feedbackClient().findUnique({ where: { token } });
}

export async function submitClassFeedback(
  token: string,
  input: {
    rating: number;
    comments: string;
    shareOnWebsite: boolean;
  },
) {
  const existing = await feedbackClient().findUnique({ where: { token } });
  if (!existing) throw new Error("This feedback link is invalid or has expired.");
  if (existing.submittedAt) {
    throw new Error("Feedback has already been submitted for this link.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Please choose a rating from 1 to 5.");
  }

  return feedbackClient().update({
    where: { token },
    data: {
      rating: input.rating,
      comments: input.comments.trim() || null,
      shareOnWebsite: Boolean(input.shareOnWebsite),
      submittedAt: new Date(),
    },
  });
}
