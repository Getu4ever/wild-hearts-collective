"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminBookingActions } from "@/app/components/admin-booking-actions";
import { AdminCapacityBadge } from "@/app/components/admin-capacity-badge";

type RosterBooking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  attendance: string | null;
  paidWithCredit: boolean;
  user: {
    id: string;
    parQCompleted: boolean;
    parQRequired: boolean;
    creditsRemaining: number;
    safetyNotes: string[];
  } | null;
};

type WaitlistEntry = {
  id: string;
  position: number;
  name: string;
  email: string;
  status: string;
  parQCompleted: boolean;
};

export function AdminSessionRosterPanel({
  sessionId,
  bookings,
  waitlist,
}: {
  sessionId: string;
  bookings: RosterBooking[];
  waitlist: WaitlistEntry[];
}) {
  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-plum">Class roster</h2>
          <Link
            href={`/admin/sessions/${sessionId}#force-book`}
            className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
          >
            Force book student
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-plum/15 px-6 py-10 text-sm text-muted">
            No bookings yet for this session.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-plum/10 bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">PAR-Q</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-plum/8 align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium text-plum">{booking.name}</p>
                      {booking.user && (
                        <Link
                          href={`/admin/members/${booking.user.id}`}
                          className="text-xs text-brand hover:underline"
                        >
                          View member
                        </Link>
                      )}
                      {booking.user?.safetyNotes.length ? (
                        <p className="mt-2 text-xs text-brand">
                          {booking.user.safetyNotes.join(" · ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <a href={`mailto:${booking.email}`} className="hover:underline">
                        {booking.email}
                      </a>
                      {booking.phone && <p className="mt-1">{booking.phone}</p>}
                    </td>
                    <td className="px-4 py-4">
                      {booking.user?.parQRequired ? (
                        <StatusPill ok={booking.user.parQCompleted}>
                          {booking.user.parQCompleted ? "Complete" : "Missing"}
                        </StatusPill>
                      ) : (
                        <span className="text-xs text-muted">Not required</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <AdminBookingActions
                        bookingId={booking.id}
                        currentStatus={booking.status}
                        currentAttendance={booking.attendance}
                      />
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {booking.paidWithCredit ? "Credit used" : "Paid in full"}
                      {booking.user && (
                        <p className="mt-1 text-xs">
                          Balance: {booking.user.creditsRemaining}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <AdminRemoveBookingButton bookingId={booking.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-3xl text-plum">Waitlist</h2>
        {waitlist.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No one is waiting for this session.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {waitlist.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-plum/10 bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-medium text-plum">
                    #{entry.position} {entry.name}
                  </p>
                  <p className="text-sm text-muted">{entry.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill ok={entry.parQCompleted}>
                    PAR-Q {entry.parQCompleted ? "OK" : "Missing"}
                  </StatusPill>
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {entry.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-emerald-50 text-emerald-900" : "bg-brand/10 text-brand"
      }`}
    >
      {children}
    </span>
  );
}

function AdminRemoveBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [refundCredit, setRefundCredit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function removeBooking() {
    if (!confirm("Remove this student from the class?")) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", refundCredit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove booking.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={refundCredit}
          onChange={(event) => setRefundCredit(event.target.checked)}
        />
        Refund credit
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={removeBooking}
        className="rounded-sm border border-brand/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand hover:bg-brand/5 disabled:opacity-60"
      >
        {loading ? "Removing…" : refundCredit ? "Remove + refund" : "Late remove"}
      </button>
      {error && <p className="text-xs text-brand">{error}</p>}
    </div>
  );
}

export function AdminForceBookForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<
    Array<{ id: string; name: string; email: string; creditsRemaining: number }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [deductCredit, setDeductCredit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchMembers(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setMembers([]);
      return;
    }

    const response = await fetch(
      `/api/admin/bookings?q=${encodeURIComponent(value.trim())}`,
    );
    const data = await response.json();
    setMembers(data.members ?? []);
  }

  function selectMember(member: { id: string; name: string; email: string }) {
    setSelectedUserId(member.id);
    setName(member.name);
    setEmail(member.email);
    setMembers([]);
    setQuery(member.name);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId: selectedUserId || undefined,
          name,
          email,
          deductCredit,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to force book.");
      setQuery("");
      setSelectedUserId("");
      setName("");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to force book.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="force-book"
      onSubmit={handleSubmit}
      className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm"
    >
      <h2 className="font-display text-2xl text-plum">Force book student</h2>
      <p className="mt-2 text-sm text-muted">
        Override capacity and credit checks to add a student manually.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="font-semibold text-plum">Search member</span>
          <input
            type="search"
            value={query}
            onChange={(event) => searchMembers(event.target.value)}
            placeholder="Name or email"
            className="w-full rounded-sm border border-plum/15 px-3 py-2"
          />
        </label>

        {members.length > 0 && (
          <ul className="rounded-sm border border-plum/10 bg-white">
            {members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => selectMember(member)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-pink-soft/40"
                >
                  {member.name} · {member.email} · {member.creditsRemaining} credits
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-plum">Full name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-sm border border-plum/15 px-3 py-2"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-plum">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-sm border border-plum/15 px-3 py-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={deductCredit}
            onChange={(event) => setDeductCredit(event.target.checked)}
          />
          Deduct 1 credit from member account
        </label>

        {error && <p className="text-sm text-brand">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-sage px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand disabled:opacity-60"
        >
          {loading ? "Booking…" : "Force book into class"}
        </button>
      </div>
    </form>
  );
}

export function AdminCancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancelSession() {
    if (
      !confirm(
        "Cancel this class? All booked students will be notified and credits refunded.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cancel session.");
      router.push("/admin/schedule");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-brand/20 bg-brand/5 p-6">
      <h2 className="font-display text-2xl text-brand">Cancel class</h2>
      <p className="mt-2 text-sm text-muted">
        Cancels the session, refunds credits to all booked students, and sends email alerts.
      </p>
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Optional reason for students"
        className="mt-4 w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
      />
      {error && <p className="mt-2 text-sm text-brand">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={cancelSession}
        className="mt-4 rounded-sm bg-brand px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Cancelling…" : "Cancel class"}
      </button>
    </div>
  );
}

export { AdminCapacityBadge };
