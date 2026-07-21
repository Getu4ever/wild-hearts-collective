import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBookingActions } from "@/app/components/admin-booking-actions";
import { AdminLogoutButton } from "@/app/components/admin-logout-button";
import { AdminNav } from "@/app/components/admin-nav";
import { AdminWaitlistActions } from "@/app/components/admin-waitlist-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatSessionDateTime, formatUkDateTimeShort } from "@/lib/booking-config";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Bookings",
  robots: { index: false, follow: false },
};


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
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-5 h-px w-12 bg-pink" />
          <h1 className="font-display text-4xl text-plum sm:text-5xl">Bookings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Manage confirmed, pending, and cancelled bookings. Use the status dropdown to
            cancel, or <strong>Delete</strong> to permanently remove test entries (no email
            sent).
          </p>
          <AdminNav active="bookings" />
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-plum/10 bg-surface shadow-sm">
        {bookings.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted">No bookings yet.</p>
        ) : (
          <div className="min-w-0">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="w-[9%] px-3 py-3 font-semibold">Booked</th>
                  <th className="w-[11%] px-3 py-3 font-semibold">Class</th>
                  <th className="w-[11%] px-3 py-3 font-semibold">Session</th>
                  <th className="w-[9%] px-3 py-3 font-semibold">Name</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">Email</th>
                  <th className="w-[9%] px-3 py-3 font-semibold">Phone</th>
                  <th className="w-[13%] px-3 py-3 font-semibold">Notes</th>
                  <th className="w-[7%] px-3 py-3 font-semibold">Paid</th>
                  <th className="w-[17%] px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-plum/8 align-top last:border-b-0"
                  >
                    <td className="px-3 py-3 text-muted">
                      {formatUkDateTimeShort(booking.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p
                        className="truncate font-medium text-plum"
                        title={booking.session.class.title}
                      >
                        {booking.session.class.title}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {formatSessionDateTime(booking.session.startsAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="truncate text-foreground" title={booking.name}>
                        {booking.name}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={`mailto:${booking.email}`}
                        className="block truncate text-plum hover:text-pink hover:underline"
                        title={booking.email}
                      >
                        {booking.email}
                      </a>
                    </td>
                    <td className="px-3 py-3">
                      <p className="truncate text-muted" title={booking.phone ?? undefined}>
                        {booking.phone ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="line-clamp-2 text-muted" title={booking.notes ?? undefined}>
                        {booking.notes ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {booking.amountPaid != null
                        ? `£${(booking.amountPaid / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <AdminBookingActions
                        bookingId={booking.id}
                        currentStatus={booking.status}
                        currentAttendance={booking.attendance}
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
            <div className="min-w-0">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                  <tr>
                    <th className="w-[11%] px-3 py-3 font-semibold">Joined</th>
                    <th className="w-[16%] px-3 py-3 font-semibold">Class</th>
                    <th className="w-[16%] px-3 py-3 font-semibold">Session</th>
                    <th className="w-[14%] px-3 py-3 font-semibold">Name</th>
                    <th className="w-[24%] px-3 py-3 font-semibold">Email</th>
                    <th className="w-[19%] px-3 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-plum/8 align-top last:border-b-0"
                    >
                      <td className="px-3 py-3 text-muted">
                        {formatUkDateTimeShort(entry.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <p
                          className="truncate font-medium text-plum"
                          title={entry.session.class.title}
                        >
                          {entry.session.class.title}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {formatSessionDateTime(entry.session.startsAt)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="truncate text-foreground" title={entry.name}>
                          {entry.name}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={`mailto:${entry.email}`}
                          className="block truncate text-plum hover:text-pink hover:underline"
                          title={entry.email}
                        >
                          {entry.email}
                        </a>
                      </td>
                      <td className="px-3 py-3">
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
