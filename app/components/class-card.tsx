import Image from "next/image";
import Link from "next/link";
import type { HeroImageKey } from "@/lib/hero-images";
import { heroImages } from "@/lib/hero-images";

type ClassCardProps = {
  title: string;
  description: string;
  href: string;
  gradient: string;
  imageKey?: HeroImageKey;
  light?: boolean;
};

export function ClassCard({
  title,
  description,
  href,
  gradient,
  imageKey,
  light = false,
}: ClassCardProps) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-sm ${
        light ? "bg-white/10 ring-1 ring-white/15" : "bg-surface shadow-sm ring-1 ring-plum/5"
      }`}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageKey ? (
            <>
              <Image
                src={heroImages[imageKey]}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className={`absolute inset-0 ${
                  light
                    ? "bg-plum/35"
                    : "bg-gradient-to-t from-plum/50 via-plum/10 to-transparent"
                }`}
              />
            </>
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${gradient} transition-transform duration-700 group-hover:scale-105`}
              aria-hidden="true"
            />
          )}
        </div>
        <div className={`p-6 ${light ? "text-white" : ""}`}>
          <h3
            className={`font-display text-2xl ${
              light ? "text-white" : "text-plum"
            }`}
          >
            {title}
          </h3>
          <p
            className={`mt-3 text-sm leading-relaxed ${
              light ? "text-white/85" : "text-muted"
            }`}
          >
            {description}
          </p>
        </div>
      </Link>
      <div className="mt-auto px-6 pb-6">
        <Link
          href={href}
          className={`inline-flex text-sm font-semibold uppercase tracking-wider transition-colors ${
            light
              ? "text-pink hover:text-white"
              : "text-plum hover:text-pink"
          }`}
        >
          Find out more →
        </Link>
      </div>
    </article>
  );
}
