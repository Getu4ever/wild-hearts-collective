import type { Metadata } from "next";
import Link from "next/link";
import { MemberLogoutButton } from "@/app/components/member-logout-button";
import { MembershipSubscribeButton } from "@/app/components/membership-subscribe-button";
import { BOOKING_URL } from "@/lib/constants";
import { formatSessionDateTime } from "@/lib/booking-config";
import { getCurrentMember } from "@/lib/member-auth";
import {
  calculateProfileCompletion,
  profileSelectFields,
} from "@/lib/member-profile-service";
import {
  membershipPlanLabel,
  membershipStatusLabel,
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
} from "@/lib/membership-config";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ membership?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) return null;

  const params = await searchParams;
  const showMembershipSuccess = params.membership === "success";

  const [upcomingBookings, recentBookings, profileRecord] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: member.id,
        session: { startsAt: { gte: new Date() } },
        status: { in: ["pending", "confirmed"] },
      },
      orderBy: { session: { startsAt: "asc" } },
      take: 5,
      include: {
        session: { include: { class: true } },
      },
    }),
    db.booking.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        session: { include: { class: true } },
      },
    }),
    db.user.findUnique({
      where: { id: member.id },
      select: profileSelectFields,
    }),
  ]);

  const profileCompletion = profileRecord
    ? calculateProfileCompletion(profileRecord)
    : { percent: 0, missingSteps: [] as string[] };

  const isMonthlyActive =
    member.membershipPlan === MEMBERSHIP_PLAN.monthly &&
    member.membershipStatus === MEMBERSHIP_STATUS.active;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {showMembershipSuccess && (
        <div className="mb-8 rounded-sm border border-sage/30 bg-sage-light px-4 py-3 text-sm text-plum">
          Welcome to Monthly Membership! Your subscription is being activated — it may take a
          moment to appear below.
        </div>
      )}

      {profileCompletion.percent < 100 && (
        <div className="mb-8 rounded-sm border border-pink/30 bg-pink-soft/40 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-plum">Complete your profile</p>
              <p className="mt-1 text-sm text-muted">
                {profileCompletion.percent}% complete — help us keep you safe and tailor your
                studio experience.
              </p>
            </div>
            <Link
              href="/account/profile"
              className="rounded-sm bg-plum px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover"
            >
              Continue profile
            </Link>
          </div>
          {profileCompletion.missingSteps.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profileCompletion.missingSteps.slice(0, 3).map((step) => (
                <li
                  key={step}
                  className="rounded-full border border-plum/10 bg-white px-3 py-1 text-xs text-muted"
                >
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-sm border border-plum/10 bg-surface p-6">
          <h2 className="font-display text-3xl text-plum">Upcoming classes</h2>
          {upcomingBookings.length === 0 ? (
            <div className="mt-6">
              <p className="text-sm text-muted">You don&apos;t have any upcoming bookings yet.</p>
              <Link
                href={BOOKING_URL}
                className="mt-4 inline-block rounded-sm bg-plum px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover"
              >
                Book a class
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {upcomingBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-sm border border-plum/10 bg-white px-4 py-4"
                >
                  <p className="font-semibold text-plum">{booking.session.class.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatSessionDateTime(booking.session.startsAt)}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand">
                    {booking.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-sm border border-plum/10 bg-surface p-6">
            <h2 className="font-display text-2xl text-plum">Membership</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted">Plan</dt>
                <dd className="font-semibold text-plum">
                  {membershipPlanLabel(member.membershipPlan)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="font-semibold text-plum">
                  {membershipStatusLabel(member.membershipStatus)}
                </dd>
              </div>
              {member.membershipRenewsAt && (
                <div>
                  <dt className="text-muted">Renews</dt>
                  <dd className="font-semibold text-plum">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(member.membershipRenewsAt)}
                  </dd>
                </div>
              )}
            </dl>

            {!isMonthlyActive && (
              <div className="mt-6">
                <MembershipSubscribeButton />
              </div>
            )}
          </section>

          <section className="rounded-sm border border-plum/10 bg-surface p-6">
            <h2 className="font-display text-2xl text-plum">Quick links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={BOOKING_URL} className="font-semibold text-brand hover:underline">
                  Book a class
                </Link>
              </li>
              <li>
                <Link
                  href="/account/bookings"
                  className="font-semibold text-brand hover:underline"
                >
                  View all bookings
                </Link>
              </li>
              <li>
                <Link
                  href="/account/profile"
                  className="font-semibold text-brand hover:underline"
                >
                  Edit profile
                </Link>
              </li>
              <li>
                <MemberLogoutButton />
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {recentBookings.length > 0 && (
        <section className="mt-10 rounded-sm border border-plum/10 bg-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-plum">Recent activity</h2>
            <Link href="/account/bookings" className="text-sm font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-plum/10">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-plum">{booking.session.class.title}</p>
                    <p className="text-sm text-muted">
                      {formatSessionDateTime(booking.session.startsAt)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                    {booking.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
