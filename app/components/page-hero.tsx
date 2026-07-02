import Image from "next/image";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";
import { HeroEnter } from "./hero-enter";

type PageHeroProps = {
  title: string;
  subtitle?: string;
  image?: HeroImageKey;
  fullScreen?: boolean;
  priority?: boolean;
};

export function PageHero({
  title,
  subtitle,
  image = "home",
  fullScreen = false,
  priority = false,
}: PageHeroProps) {
  const src = heroImages[image];

  return (
    <section
      className={`relative flex items-end overflow-hidden ${
        fullScreen ? "min-h-[72vh] lg:min-h-[88vh]" : "min-h-[44vh] lg:min-h-[52vh]"
      }`}
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-plum/90 via-plum/45 to-plum/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-plum/35 via-transparent to-pink/10"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-28 lg:px-8 lg:pb-16">
        <HeroEnter className="max-w-3xl border-l-2 border-pink pl-6 sm:pl-8">
          <h1 className="font-display text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {subtitle}
            </p>
          )}
        </HeroEnter>
      </div>
    </section>
  );
}
