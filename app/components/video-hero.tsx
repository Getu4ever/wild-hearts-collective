"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BOOKING_URL } from "@/lib/constants";
import { HeroEnter } from "./hero-enter";

type VideoHeroProps = {
  title: string;
  subtitle?: string;
  videoSrc: string;
  posterSrc: string;
};

export function VideoHero({
  title,
  subtitle,
  videoSrc,
  posterSrc,
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      /* Autoplay may be blocked until user interaction. Poster remains visible. */
    });
  }, []);

  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden lg:min-h-[72vh]">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={posterSrc}
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-plum/60 via-plum/25 to-plum/8"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-plum/25 via-transparent to-pink/8"
      />

      <div className="relative mx-auto mt-36 w-full max-w-6xl px-6 pb-10 sm:mt-40 lg:mt-44 lg:px-8 lg:pb-14">
        <HeroEnter className="max-w-3xl border-l-2 border-pink pl-6 sm:pl-8">
          <h1 className="font-display text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {subtitle}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={BOOKING_URL}
              className="inline-flex items-center justify-center rounded-sm bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-brand transition hover:bg-pink-light"
            >
              Book a Class
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-sm border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Explore Classes
            </Link>
          </div>
        </HeroEnter>
      </div>
    </section>
  );
}
