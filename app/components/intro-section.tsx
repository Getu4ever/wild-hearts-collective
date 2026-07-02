import Image from "next/image";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";
import { ContentSection, ProseBlock } from "./content-section";
import { SectionHeading } from "./section-heading";

type IntroSectionProps = {
  title: string;
  subtitle?: string;
  imageKey: HeroImageKey;
  imageAlt: string;
  children: React.ReactNode;
};

export function IntroSection({
  title,
  subtitle,
  imageKey,
  imageAlt,
  children,
}: IntroSectionProps) {
  return (
    <ContentSection>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading title={title} subtitle={subtitle} />
          <ProseBlock>{children}</ProseBlock>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10 sm:aspect-[3/2]">
          <Image
            src={heroImages[imageKey]}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-plum/40 via-transparent to-transparent"
          />
        </div>
      </div>
    </ContentSection>
  );
}
