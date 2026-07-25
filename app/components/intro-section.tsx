import Image from "next/image";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";
import { ContentSection, ProseBlock } from "./content-section";
import { FeatureVideo } from "./feature-video";
import { SectionHeading } from "./section-heading";

type IntroSectionProps = {
  title: string;
  subtitle?: string;
  imageKey: HeroImageKey;
  /** Optional override when the large intro image differs from the page hero. */
  imageSrc?: string;
  imageAlt: string;
  imageOverlay?: string;
  videoSrc?: string;
  videoTitle?: string;
  children: React.ReactNode;
};

export function IntroSection({
  title,
  subtitle,
  imageKey,
  imageSrc,
  imageAlt,
  imageOverlay,
  videoSrc,
  videoTitle,
  children,
}: IntroSectionProps) {
  const poster = imageSrc ?? heroImages[imageKey];

  return (
    <ContentSection>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading title={title} subtitle={subtitle} />
          <ProseBlock>{children}</ProseBlock>
        </div>

        {videoSrc ? (
          <div className="relative">
            <FeatureVideo
              src={videoSrc}
              poster={poster}
              title={videoTitle ?? title}
              aspectClassName="aspect-[16/10] sm:aspect-[3/2]"
            />
            {imageOverlay ? (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-plum/90 via-plum/50 to-transparent px-5 pb-5 pt-16 text-sm font-medium leading-snug text-white sm:text-base">
                {imageOverlay}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10 sm:aspect-[3/2]">
            <Image
              src={poster}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-plum/55 via-transparent to-transparent"
            />
            {imageOverlay ? (
              <p className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 text-sm font-medium leading-snug text-white sm:text-base">
                {imageOverlay}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </ContentSection>
  );
}
