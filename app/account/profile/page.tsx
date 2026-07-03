import type { Metadata } from "next";
import { MemberProfileDashboard } from "@/app/components/member-profile-dashboard";
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

  const [user, upcomingBookings, pastBookings, timeline] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: profileSelectFields,
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

  return (
    <MemberProfileDashboard
      initialProfile={toMemberProfile(user)}
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
