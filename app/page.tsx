import Link from "next/link";
import { ClassCard } from "./components/class-card";
import {
  ContentSection,
  ProseBlock,
  ReadMoreLink,
} from "./components/content-section";
import { FaqPreview } from "./components/faq-preview";
import { StatsSection } from "./components/stats-section";
import { WhyChooseUs } from "./components/why-choose-us";
import { VideoHero } from "./components/video-hero";
import { SectionHeading } from "./components/section-heading";
import { Timetable } from "./components/timetable";
import { classes, siteConfig } from "@/lib/site-data";
import { classSlugToHero, type HeroImageKey } from "@/lib/hero-images";

function getClassHeroKey(slug: string): HeroImageKey {
  return classSlugToHero[slug] ?? "community";
}

export default function Home() {
  return (
    <>
      <VideoHero
        title="Welcome to Wild Hearts Collective"
        subtitle="Spin, climb, and stretch in a safe, inclusive studio for all bodies, ages, and abilities."
        videoSrc="/hero/hero-home.mp4"
        posterSrc="/hero/hero-home.jpg"
      />

      <ContentSection>
        <SectionHeading title="About us" />
        <ProseBlock>
          <p>
            Wild Hearts Collective is an inclusive aerial and pole studio and
            community hub, founded by qualified instructors Rosie, Jacqui, and
            Sarah. We offer accessible pole, aerial hoop, silks, and creative
            arts workshops in a welcoming, supportive environment.
          </p>
          <p>
            With a community-driven focus on accessibility and wellbeing, we
            empower everyone to explore movement, build confidence, develop new
            skills, and find their people. Learn more about our journey, space,
            and classes on our{" "}
            <Link href="/about">About Us page</Link>.
          </p>
        </ProseBlock>
        <ReadMoreLink href="/about" />
      </ContentSection>

      <StatsSection />

      <WhyChooseUs />

      <ContentSection className="bg-plum text-white">
        <SectionHeading
          title="Our Classes"
          subtitle={siteConfig.bookingNote}
          light
        />
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75">
          {siteConfig.levelNote}
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {classes.map((item) => (
            <li key={item.slug}>
              <ClassCard
                title={item.title}
                description={item.shortDescription}
                href={item.href}
                gradient={item.gradient}
                imageKey={getClassHeroKey(item.slug)}
                light
              />
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection className="bg-pink-soft">
        <SectionHeading title="Class Timetable" />
        <Timetable />
      </ContentSection>

      <FaqPreview />
    </>
  );
}
