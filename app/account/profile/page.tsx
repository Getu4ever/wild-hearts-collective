import type { Metadata } from "next";
import { MemberProfileDashboard } from "@/app/components/member-profile-dashboard";
import { expireStalePendingBookings } from "@/lib/booking-service";
import { ensureGoogleProfileImage } from "@/lib/google-auth-service";
import { getMemberSession } from "@/lib/member-auth";
import { profileSelectFields, toMemberProfile } from "@/lib/member-profile-service";
import { getMembershipTimeline } from "@/lib/membership-actions";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const session = await getMemberSession();
  if (!session) return null;

  await expireStalePendingBookings();
  await ensureGoogleProfileImage(session.userId);

  const [user, oauthAccounts, upcomingBookings, pastBookings, timeline] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: profileSelectFields,
    }),
    db.oAuthAccount.findMany({
      where: { userId: session.userId },
      select: { provider: true, profileImageUrl: true },
    }),
    db.booking.findMany({
      where: {
        userId: session.userId,
        session: { startsAt: { gte: new Date() } },
        status: { in: ["pending", "confirmed"] },
      },
      orderBy: { session: { startsAt: "asc" } },
      take: 5,
      include: { session: { include: { class: true } } },
    }),
    db.booking.findMany({
      where: {
        userId: session.userId,
        session: { startsAt: { lt: new Date() } },
      },
      orderBy: { session: { startsAt: "desc" } },
      take: 10,
      include: { session: { include: { class: true } } },
    }),
    getMembershipTimeline(session.userId),
  ]);

  if (!user) return null;

  const googleAccount = oauthAccounts.find((account) => account.provider === "google");
  const isGoogleAccount = Boolean(googleAccount);
  const profile = toMemberProfile({
    ...user,
    image: user.image ?? googleAccount?.profileImageUrl ?? null,
  });

  return (
    <MemberProfileDashboard
      initialProfile={profile}
      isGoogleAccount={isGoogleAccount}
      upcomingBookings={upcomingBookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        attendance: booking.attendance,
        classTitle: booking.session.class.title,
        startsAt: booking.session.startsAt.toISOString(),
      }))}
      pastBookings={pastBookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        attendance: booking.attendance,
        classTitle: booking.session.class.title,
        startsAt: booking.session.startsAt.toISOString(),
      }))}
      timeline={timeline.map((event) => ({
        id: event.id,
        type: event.type,
        note: event.note,
        effectiveAt: event.effectiveAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
      }))}
    />
  );
}
