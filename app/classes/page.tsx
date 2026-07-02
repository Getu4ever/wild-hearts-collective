import type { Metadata } from "next";
import Link from "next/link";
import { ClassCard } from "@/app/components/class-card";
import { ContentSection } from "@/app/components/content-section";
import { PageHero } from "@/app/components/page-hero";
import { SectionHeading } from "@/app/components/section-heading";
import { BookButton } from "@/app/components/book-button";
import { classes, siteConfig } from "@/lib/site-data";
import { classSlugToHero, type HeroImageKey } from "@/lib/hero-images";

function getClassHeroKey(slug: string): HeroImageKey {
  return classSlugToHero[slug] ?? "community";
}

export const metadata: Metadata = {
  title: "Our Classes",
  description:
    "Pole dancing, aerial hoop, aerial silks, and creative arts workshops for all levels at Wild Hearts Collective.",
};

export default function ClassesPage() {
  return (
    <>
      <PageHero
        title="Our Classes"
        subtitle="Expert-led pole and aerial classes in a safe, inclusive studio."
        image="classes"
      />

      <ContentSection>
        <SectionHeading
          title="Find your class"
          subtitle="We provide several different classes throughout the week. Please read the information below — some classes are ability-specific."
        />
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
          {siteConfig.bookingNote}{" "}
          <Link href="/contact" className="font-medium text-plum hover:text-pink hover:underline">
            Contact us
          </Link>{" "}
          if you need help choosing the right level.
        </p>
        <div className="mt-8">
          <BookButton>Book now</BookButton>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {classes.map((item) => (
            <li key={item.slug}>
              <ClassCard
                title={item.title}
                description={item.shortDescription}
                href={item.href}
                gradient={item.gradient}
                imageKey={getClassHeroKey(item.slug)}
              />
            </li>
          ))}
        </ul>
      </ContentSection>
    </>
  );
}
