import type { Metadata } from "next";
import Link from "next/link";
import { formatSessionDateTime, formatUkDateTimeShort } from "@/lib/booking-config";
import { getCurrentMember } from "@/lib/member-auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};


export default async function AccountBookingsPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const [bookings, waitlist] = await Promise.all([
    db.booking.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      include: {
        session: { include: { class: true } },
      },
    }),
    db.waitlistEntry.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      include: {
        session: { include: { class: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="font-display text-3xl text-plum">My bookings</h2>
      <p className="mt-2 text-sm text-muted">
        Bookings linked to your account appear here.{" "}
        <Link href="/book" className="font-semibold text-brand hover:underline">
          Book another class
        </Link>
      </p>

      <section className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">Class bookings</h3>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-sm border border-plum/10 bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-plum/10 bg-cream/50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 font-medium text-plum">
                      {booking.session.class.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatSessionDateTime(booking.session.startsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatUkDateTimeShort(booking.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand">Waitlist</h3>
        {waitlist.length === 0 ? (
          <p className="mt-4 text-sm text-muted">You&apos;re not on any waitlists.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-sm border border-plum/10 bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-plum/10 bg-cream/50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {waitlist.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium text-plum">
                      {entry.session.class.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatSessionDateTime(entry.session.startsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
