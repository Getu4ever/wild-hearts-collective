import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBookingActions } from "@/app/components/admin-booking-actions";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminWaitlistActions } from "@/app/components/admin-waitlist-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSessionDateTime } from "@/lib/booking-config";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Bookings",
  robots: { index: false, follow: false },
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminBookingsPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    redirect("/admin/login");
  }

  const [bookings, waitlist] = await Promise.all([
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        session: {
          include: { class: true },
        },
      },
    }),
    db.waitlistEntry.findMany({
      where: { status: { in: ["waiting", "notified"] } },
      orderBy: { createdAt: "asc" },
      include: {
        session: {
          include: { class: true },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Bookings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Manage confirmed, pending, and cancelled bookings. Update statuses, review
            deposits, and monitor the waitlist.
          </p>
          <AdminNav active="bookings" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        {bookings.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="px-4 py-3 font-semibold">Booked</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold">Deposit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-plum/8 align-top last:border-b-0"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-muted">
                      {formatDateTime(booking.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-medium text-plum">
                      {booking.session.class.title}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted">
                      {formatSessionDateTime(booking.session.startsAt)}
                    </td>
                    <td className="px-4 py-4 text-foreground">{booking.name}</td>
                    <td className="px-4 py-4">
                      <a
                        href={`mailto:${booking.email}`}
                        className="text-plum hover:text-pink hover:underline"
                      >
                        {booking.email}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {booking.phone ?? "—"}
                    </td>
                    <td className="px-4 py-4 max-w-xs text-muted">
                      {booking.notes ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {booking.amountPaid != null
                        ? `£${(booking.amountPaid / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <AdminBookingActions
                        bookingId={booking.id}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-14">
        <h2 className="font-display text-3xl text-plum">Waitlist</h2>
        <p className="mt-3 text-sm text-muted">
          People waiting for full sessions. Cancelling a confirmed booking automatically
          emails the next person on the waitlist.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
          {waitlist.length === 0 ? (
            <p className="px-6 py-10 text-sm text-muted">No one is on the waitlist.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Session</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-plum/8 align-top last:border-b-0"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-muted">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-medium text-plum">
                        {entry.session.class.title}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-muted">
                        {formatSessionDateTime(entry.session.startsAt)}
                      </td>
                      <td className="px-4 py-4 text-foreground">{entry.name}</td>
                      <td className="px-4 py-4">
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-plum hover:text-pink hover:underline"
                        >
                          {entry.email}
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <AdminWaitlistActions
                          entryId={entry.id}
                          currentStatus={entry.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        Public booking page:{" "}
        <Link href="/book" className="font-medium text-plum hover:text-pink hover:underline">
          /book
        </Link>
      </p>
    </div>
  );
}
