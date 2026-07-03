"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookingEmbeddedCheckout } from "@/app/components/booking-embedded-checkout";
import { siteConfig } from "@/lib/site-data";

type SessionOption = {
  id: string;
  classSlug: string;
  classTitle: string;
  startsAt: string;
  spotsLeft: number;
  isFull: boolean;
  waitlistCount: number;
};

type BookingConfig = {
  depositLabel: string;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  emailEnabled: boolean;
};

type PendingPayment = {
  clientSecret: string;
  booking: {
    id: string;
    name: string;
    email: string;
    classTitle: string;
    startsAt: string;
    depositLabel: string;
  };
};

type BookingResult = {
  type: "booking" | "waitlist";
  id: string;
  name: string;
  email: string;
  classTitle: string;
  startsAt: string;
  status?: string;
  paymentSkipped?: boolean;
};

type MemberProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

type ContactDetails = {
  name: string;
  email: string;
  phone: string;
};

const classFilters = [
  { value: "all", label: "All classes" },
  { value: "pole", label: "Pole" },
  { value: "aerial-hoop", label: "Hoop" },
  { value: "aerial-silks", label: "Silks" },
] as const;

const bookingSteps = [
  { title: "Choose a session", detail: "Pick your class and time" },
  { title: "Enter your details", detail: "Name, email and optional notes" },
  { title: "Pay deposit online", detail: "Pay securely on this page" },
];

function formatSessionDate(startsAt: string) {
  const date = new Date(startsAt);
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
    shortDate: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function fieldClassName() {
  return "mt-2 w-full rounded-lg border border-plum/12 bg-white px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25";
}

export function BookingForm() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [classFilter, setClassFilter] = useState(
    searchParams.get("class") ?? "all",
  );
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [contact, setContact] = useState<ContactDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [notes, setNotes] = useState("");

  const cancelled = searchParams.get("cancelled") === "1";
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const depositNote = config?.depositLabel ?? "£10.00";
  const hasSelectableSession = sessions.some(
    (session) => !session.isFull || joinWaitlist,
  );

  useEffect(() => {
    async function loadMember() {
      try {
        const response = await fetch("/api/members/me");
        if (!response.ok) return;

        const data = (await response.json()) as { user: MemberProfile | null };
        if (!data.user) return;

        setMember(data.user);
        setContact({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone ?? "",
        });
      } catch {
        // Guest booking remains available if the session check fails.
      } finally {
        setMemberLoaded(true);
      }
    }

    loadMember();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      const response = await fetch("/api/bookings/config");
      if (response.ok) {
        setConfig((await response.json()) as BookingConfig);
      }
    }

    loadConfig();
  }, []);

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError("");
      try {
        const query = classFilter === "all" ? "" : `?class=${classFilter}`;
        const response = await fetch(`/api/sessions${query}`);
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Could not load sessions.");
        }
        const data = (await response.json()) as SessionOption[];
        setSessions(data);
        setSelectedSessionId((current) => {
          if (current && data.some((session) => session.id === current)) {
            return current;
          }
          const firstAvailable =
            data.find((session) => !session.isFull)?.id ?? data[0]?.id ?? "";
          return firstAvailable;
        });
      } catch {
        setError("Unable to load available sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [classFilter]);

  useEffect(() => {
    setJoinWaitlist(Boolean(selectedSession?.isFull));
  }, [selectedSession?.id, selectedSession?.isFull]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const trimmedName = contact.name.trim();
    const trimmedEmail = contact.email.trim();
    const trimmedPhone = contact.phone.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Name and email are required.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
          notes: trimmedNotes || undefined,
          joinWaitlist: selectedSession?.isFull || joinWaitlist,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Booking failed.");
      }

      if (data.type === "booking" && data.clientSecret) {
        setPendingPayment({
          clientSecret: data.clientSecret,
          booking: {
            id: data.id,
            name: data.name,
            email: data.email,
            classTitle: data.classTitle,
            startsAt: data.startsAt,
            depositLabel: data.depositLabel ?? depositNote,
          },
        });
        return;
      }

      setResult(data as BookingResult);
      setNotes("");
      if (!member) {
        setContact({ name: "", email: "", phone: "" });
      }
      setSelectedSessionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingPayment) {
    const date = formatSessionDate(pendingPayment.booking.startsAt);

    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5">
          <div className="border-b border-plum/8 bg-gradient-to-r from-pink-soft/50 to-surface px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Step 3 of 3
            </p>
            <h2 className="mt-2 font-display text-3xl text-plum sm:text-4xl">
              Pay your deposit
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Complete payment below to secure your place. Your booking stays on this page —
              no redirect to another site.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className="rounded-xl border border-plum/10 bg-pink-soft/40 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Your booking
              </p>
              <p className="mt-2 font-semibold text-plum">{pendingPayment.booking.classTitle}</p>
              <p className="mt-1 text-sm text-muted">
                {date.weekday}, {date.shortDate} · {date.time}
              </p>
              <p className="mt-2 text-sm text-muted">
                Deposit:{" "}
                <strong className="text-foreground">{pendingPayment.booking.depositLabel}</strong>
              </p>
            </div>

            <BookingEmbeddedCheckout
              clientSecret={pendingPayment.clientSecret}
              publishableKey={config?.stripePublishableKey ?? ""}
            />

            {error && (
              <p
                className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setPendingPayment(null);
                setError("");
              }}
              className="rounded-lg border border-plum/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:bg-pink-soft"
            >
              Back to booking details
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm ring-1 ring-plum/5">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
              Secure payment
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Cards, Apple Pay, Google Pay, and other methods appear automatically. We never
              store your full card details.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  if (result) {
    const date = formatSessionDate(result.startsAt);
    const isWaitlist = result.type === "waitlist";

    return (
      <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5">
        <div className="bg-gradient-to-r from-plum to-brand px-8 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-light">
            {isWaitlist ? "Waitlist" : "Success"}
          </p>
          <h2 className="mt-2 font-display text-4xl">
            {isWaitlist ? "You are on the waitlist" : "Thank you for booking"}
          </h2>
        </div>
        <div className="space-y-4 px-8 py-8">
          <p className="text-base leading-relaxed text-muted">
            {isWaitlist ? (
              <>
                Hi {result.name}, we have added you to the waitlist for{" "}
                <strong className="text-foreground">{result.classTitle}</strong> on{" "}
                {date.weekday} {date.shortDate} at {date.time}. We will email you if
                a place opens up.
              </>
            ) : (
              <>
                Hi {result.name}, your request for{" "}
                <strong className="text-foreground">{result.classTitle}</strong> on{" "}
                {date.weekday} {date.shortDate} at {date.time} has been received.
              </>
            )}
          </p>
          <p className="rounded-lg bg-pink-soft/80 px-4 py-3 text-sm leading-relaxed text-plum">
            {isWaitlist
              ? `We have recorded ${result.email} on the waitlist.`
              : result.paymentSkipped
                ? `Your booking is confirmed. A confirmation email has been sent to ${result.email}.`
                : `We will send a confirmation email to ${result.email} once your deposit payment is complete.`}
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-lg bg-plum px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-plum-hover"
            >
              {isWaitlist ? "Join another waitlist" : "Book another class"}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-plum/15 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-plum transition hover:bg-pink-soft"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedDate = selectedSession
    ? formatSessionDate(selectedSession.startsAt)
    : null;
  const isSignedIn = Boolean(member);
  const visibleSteps = isSignedIn
    ? [
        bookingSteps[0],
        { title: "Confirm your details", detail: "Using your member profile" },
        bookingSteps[2],
      ]
    : bookingSteps;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-lg ring-1 ring-plum/5"
      >
        <div className="border-b border-plum/8 bg-gradient-to-r from-pink-soft/50 to-surface px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Book online
          </p>
          <h2 className="mt-2 font-display text-3xl text-plum sm:text-4xl">
            Reserve your class
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {siteConfig.bookingNote} Pay a {depositNote} deposit online to secure
            your place — quick, secure, and confirmed by email.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-8">
          {cancelled && (
            <p
              className="rounded-lg border border-pink/30 bg-pink-light px-4 py-3 text-sm text-plum"
              role="status"
            >
              Payment was cancelled. Your booking is still pending until the deposit is paid.
              Choose your session again and complete payment below.
            </p>
          )}

          <section aria-labelledby="booking-step-1">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum text-sm font-bold text-white">
                1
              </span>
              <div>
                <h3 id="booking-step-1" className="text-lg font-semibold text-plum">
                  Choose your class
                </h3>
                <p className="text-sm text-muted">Filter by type, then select a session.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {classFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setClassFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    classFilter === filter.value
                      ? "bg-plum text-white shadow-sm"
                      : "bg-pink-soft text-plum hover:bg-pink-light"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {loading && (
                <p className="rounded-lg border border-dashed border-plum/15 px-4 py-8 text-center text-sm text-muted">
                  Loading sessions…
                </p>
              )}
              {!loading && sessions.length === 0 && (
                <p className="rounded-lg border border-dashed border-plum/15 px-4 py-8 text-center text-sm text-muted">
                  No upcoming sessions for this class. Try another filter or contact us.
                </p>
              )}
              {!loading &&
                sessions.map((session) => {
                  const date = formatSessionDate(session.startsAt);
                  const isSelected = selectedSessionId === session.id;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-plum bg-pink-soft/60 ring-2 ring-pink/40"
                          : "border-plum/10 bg-white hover:border-pink/40 hover:bg-pink-soft/30"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-plum">{session.classTitle}</p>
                        <p className="mt-1 text-sm text-muted">
                          {date.weekday}, {date.shortDate}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {date.time}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          session.isFull
                            ? "bg-plum/10 text-plum"
                            : "bg-pink/30 text-plum"
                        }`}
                      >
                        {session.isFull
                          ? "Full · waitlist"
                          : `${session.spotsLeft} spots left`}
                      </span>
                    </button>
                  );
                })}
            </div>

            <input type="hidden" name="sessionId" value={selectedSessionId} required />

            {selectedSession?.isFull && (
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-plum/10 bg-pink-soft/50 px-4 py-4 text-sm text-plum">
                <input
                  type="checkbox"
                  checked={joinWaitlist}
                  onChange={(event) => setJoinWaitlist(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  This session is full. Join the waitlist and we will email you if a
                  place becomes available.
                </span>
              </label>
            )}
          </section>

          <section aria-labelledby="booking-step-2">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum text-sm font-bold text-white">
                2
              </span>
              <div>
                <h3 id="booking-step-2" className="text-lg font-semibold text-plum">
                  {isSignedIn ? "Your member details" : "Your details"}
                </h3>
                <p className="text-sm text-muted">
                  {isSignedIn
                    ? "We will use the details from your signed-in account."
                    : "We will use these to confirm your booking by email."}
                </p>
              </div>
            </div>

            {isSignedIn && member ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-plum/10 bg-pink-soft/40 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                    Signed in as
                  </p>
                  <p className="mt-2 font-semibold text-plum">{member.name}</p>
                  <p className="mt-1 text-sm text-muted">{member.email}</p>
                  {member.phone && (
                    <p className="mt-1 text-sm text-muted">{member.phone}</p>
                  )}
                  <Link
                    href="/account/profile"
                    className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
                  >
                    Update in your profile
                  </Link>
                </div>

                <div>
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notes <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="First time, injuries, access needs, etc."
                    className={fieldClassName()}
                  />
                </div>
              </div>
            ) : memberLoaded ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 sm:max-w-md">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full name <span className="text-brand">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={contact.name}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, name: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email <span className="text-brand">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={contact.email}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, email: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(event) =>
                      setContact((current) => ({ ...current, phone: event.target.value }))
                    }
                    className={fieldClassName()}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="text-sm font-medium text-foreground">
                    Notes <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="First time, injuries, access needs, etc."
                    className={fieldClassName()}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Loading your details…</p>
            )}
          </section>

          {selectedSession && selectedDate && (
            <div className="rounded-xl border border-plum/10 bg-pink-soft/40 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Your selection
              </p>
              <p className="mt-2 font-semibold text-plum">{selectedSession.classTitle}</p>
              <p className="mt-1 text-sm text-muted">
                {selectedDate.weekday}, {selectedDate.shortDate} · {selectedDate.time}
              </p>
              {!selectedSession.isFull && (
                <p className="mt-2 text-sm text-muted">
                  Deposit due today: <strong className="text-foreground">{depositNote}</strong>
                </p>
              )}
            </div>
          )}

          {error && (
            <p
              className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              !memberLoaded ||
              !hasSelectableSession ||
              !selectedSessionId
            }
            className="w-full rounded-lg bg-plum px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-md shadow-plum/20 transition hover:bg-plum-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Processing…"
              : selectedSession?.isFull && joinWaitlist
                ? "Join waitlist"
                : config?.stripeEnabled
                  ? `Continue to pay ${depositNote} deposit`
                  : "Confirm booking"}
          </button>
          <p className="text-center text-xs leading-relaxed text-muted">
            Secure online payment. {siteConfig.arrivalNote}
          </p>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-plum/10 bg-surface p-6 shadow-sm ring-1 ring-plum/5">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-plum">
            How booking works
          </h3>
          <ol className="mt-5 space-y-4">
            {visibleSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-soft text-xs font-bold text-plum">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-plum/10 bg-gradient-to-br from-plum to-brand p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-light">
            Deposit
          </p>
          <p className="mt-2 text-3xl font-semibold">{depositNote}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Pay online when you book. You will receive a confirmation email once
            payment is complete.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted">
          {siteConfig.levelNote}{" "}
          <Link href="/contact" className="font-medium text-plum underline-offset-2 hover:underline">
            Contact us
          </Link>{" "}
          if you need help choosing a class.
        </p>
      </aside>
    </div>
  );
}
