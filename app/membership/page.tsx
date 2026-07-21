import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  ProseBlock,
} from "@/app/components/content-section";
import { BundlePurchaseGrid } from "@/app/components/bundle-purchase-grid";
import { MembershipSubscribeButton } from "@/app/components/membership-subscribe-button";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { formatMoneyFromPence } from "@/lib/booking-config";
import { BOOKING_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { buildMembershipPlans } from "@/lib/membership-config";
import { seedClassPacks } from "@/lib/seed-database";
import { resolveMonthlyMembershipPricePence } from "@/lib/studio-pricing-service";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join Wild Hearts Collective — create your member account, book classes online, and manage your bookings in one place.",
};

const steps = [
  {
    title: "Create your account",
    description: "Sign up with your email to access your personal member dashboard.",
  },
  {
    title: "Book a class",
    description: "Choose a session from our timetable and pay the full class fee securely online.",
  },
  {
    title: "Track everything",
    description: "View upcoming bookings, waitlist entries, and update your profile anytime.",
  },
];

export default async function MembershipPage() {
  const packCount = await db.classPack.count();
  if (packCount === 0) {
    await seedClassPacks(db);
  }

  const classPacks = await db.classPack.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const packs = classPacks.map((pack) => ({
    id: pack.id,
    slug: pack.slug,
    name: pack.name,
    description: pack.description,
    credits: pack.credits,
    priceLabel: formatMoneyFromPence(pack.pricePence),
    validDays: pack.validDays,
  }));

  const membershipPlans = buildMembershipPlans(
    formatMoneyFromPence(await resolveMonthlyMembershipPricePence()),
  );

  return (
    <>
      <PageHero
        title="Become a member"
        subtitle="Your Wild Hearts account — book classes, pay online, and manage your studio journey."
        image="community"
      />

      <ContentSection>
        <SectionHeading title="How it works" />
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-soft text-sm font-bold text-brand">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-2xl text-plum">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Membership options" />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {membershipPlans.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-sm border bg-surface p-8 ${
                plan.highlighted
                  ? "border-pink/40 shadow-sm ring-1 ring-pink/15"
                  : "border-plum/10"
              }`}
            >
              {plan.highlighted && (
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand">
                  Most popular
                </p>
              )}
              <h3 className="font-display text-3xl text-plum">{plan.name}</h3>
              <p className="mt-2">
                <span className="font-display text-4xl text-brand">{plan.price}</span>
                {plan.priceNote && (
                  <span className="ml-2 text-sm text-muted">{plan.priceNote}</span>
                )}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-plum">
                    <span className="text-brand" aria-hidden="true">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "monthly" ? (
                  <MembershipSubscribeButton />
                ) : (
                  <Link
                    href={plan.href}
                    className="block w-full rounded-sm bg-sage py-3 text-center text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {packs.length > 0 && (
          <div className="mt-16">
            <SectionHeading
              title="Class passes"
              subtitle="Prefer pay-as-you-go? Choose a 5 or 10 class pack and use credits whenever you book."
            />
            <div className="mt-12">
              <BundlePurchaseGrid packs={packs} />
            </div>
          </div>
        )}
      </ContentSection>

      <ContentSection>
        <ProseBlock>
          <h2 className="font-display text-3xl text-plum">Ready to fly?</h2>
          <p>
            All classes must be booked in advance. Once you&apos;re signed in, your bookings
            are linked to your account automatically — even when you use our existing booking
            page.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
            >
              Create free account
            </Link>
            <Link
              href={BOOKING_URL}
              className="rounded-sm border border-plum/20 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-plum transition hover:border-brand hover:text-brand"
            >
              Book a class
            </Link>
          </div>
        </ProseBlock>
      </ContentSection>
    </>
  );
}
