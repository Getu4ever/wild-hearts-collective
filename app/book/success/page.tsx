import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { BOOKING_STATUS, formatSessionDateTime } from "@/lib/booking-config";
import { finalizeBookingPayment } from "@/lib/booking-payment";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  searchParams: Promise<{ booking?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
  const { booking: bookingId } = await searchParams;

  let booking = bookingId
    ? await db.booking.findUnique({
        where: { id: bookingId },
        include: { session: { include: { class: true } } },
      })
    : null;

  if (booking && booking.status === BOOKING_STATUS.pending) {
    booking = await finalizeBookingPayment(booking.id);
  }

  const isConfirmed = booking?.status === BOOKING_STATUS.confirmed;

  return (
    <>
      <PageHero
        title={isConfirmed ? "Booking confirmed" : "Payment received"}
        subtitle="Thank you for booking with Wild Hearts Collective."
        image="classes"
      />

      <ContentSection>
        <div className="mx-auto max-w-2xl rounded-sm border border-plum/10 bg-surface p-8 shadow-sm">
          {!booking ? (
            <>
              <p className="text-muted">
                We could not find that booking. If you completed payment, please check
                your email or contact the studio.
              </p>
              <Link
                href="/book"
                className="mt-6 inline-block rounded-sm bg-plum px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover"
              >
                Back to booking
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted">
                Hi {booking.name}, your booking for{" "}
                <strong className="text-foreground">{booking.session.class.title}</strong>{" "}
                on {formatSessionDateTime(booking.session.startsAt)}{" "}
                {isConfirmed ? "is confirmed." : "is being processed."}
              </p>
              {isConfirmed ? (
                <p className="mt-4 text-sm text-muted">
                  A confirmation email has been sent to you and the studio. Please arrive
                  5–10 minutes before your class starts.
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Your payment is being processed. Please refresh this page shortly, or
                  check your inbox for your confirmation email.
                </p>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/book"
                  className="rounded-sm bg-plum px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white hover:bg-plum-hover"
                >
                  Book another class
                </Link>
                <Link
                  href="/"
                  className="rounded-sm border border-plum/15 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-plum hover:bg-pink-soft"
                >
                  Back to home
                </Link>
              </div>
            </>
          )}
        </div>
      </ContentSection>
    </>
  );
}
