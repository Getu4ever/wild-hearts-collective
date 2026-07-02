import Image from "next/image";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";

type TeamCardProps = {
  name: string;
  role: string;
  bio: string;
  imageKey?: HeroImageKey;
  imageSrc?: string;
  imagePosition?: string;
};

export function TeamCard({
  name,
  role,
  bio,
  imageKey,
  imageSrc,
  imagePosition = "object-top",
}: TeamCardProps) {
  const src = imageSrc ?? (imageKey ? heroImages[imageKey] : heroImages.pole);

  return (
    <article className="group overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-plum/8 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={src}
          alt={`${name} at Wild Hearts Collective`}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${imagePosition}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-3xl text-white">{name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-pink-light">
            {role}
          </p>
        </div>
      </div>
      <div className="border-t border-plum/8 px-5 py-5">
        <p className="text-sm leading-relaxed text-muted">{bio}</p>
      </div>
    </article>
  );
}
