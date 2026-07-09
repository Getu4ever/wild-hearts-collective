import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection } from "@/app/components/content-section";
import { IntroSection } from "@/app/components/intro-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";

export const metadata: Metadata = {
  title: "Parties & Events",
  description:
    "Children's party packages and creative movement sessions at Wild Hearts Collective.",
};

const packages = [
  {
    title: "Children's party packages",
    description:
      "Safe, supervised aerial and movement activities tailored for young celebrants and their friends.",
  },
  {
    title: "Creative movement sessions",
    description:
      "Fun, age-appropriate sessions that build confidence through play and guided movement.",
  },
  {
    title: "Private group events",
    description:
      "Customisable options for birthdays, celebrations, and group bookings. Contact us to plan your event.",
  },
];

export default function PartiesPage() {
  return (
    <>
      <PageHero
        title="Parties & Kids Activities"
        subtitle="Safe, supervised, and unforgettable celebrations."
        image="parties"
      />

      <IntroSection
        title="Party packages"
        imageKey="parties"
        imageAlt="Children's party at Wild Hearts Collective"
      >
        <p>
          Add something unique to your next celebration. Our party packages
          combine safe, qualified instruction with creative movement — perfect
          for birthdays and special occasions.
        </p>
        <p>
          All sessions are fully supervised by our qualified team. Packages
          can be customised to suit your group size and age range.
        </p>
      </IntroSection>

      <ContentSection className="bg-pink-soft">
        <ul className="grid gap-6 sm:grid-cols-3">
          {packages.map((item) => (
            <li
              key={item.title}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <h3 className="font-display text-2xl text-plum">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection>
        <SectionHeading
          title="Make an enquiry"
          subtitle="Tell us about your event and we'll get back to you with options."
        />
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-sm bg-sage px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-sage-hover"
        >
          Send an enquiry
        </Link>
      </ContentSection>
    </>
  );
}
