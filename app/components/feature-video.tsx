"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type FeatureVideoProps = {
  src: string;
  poster: string;
  title: string;
  className?: string;
  /** Tailwind aspect ratio classes. Defaults to cinematic 16/9. */
  aspectClassName?: string;
};

export function FeatureVideo({
  src,
  poster,
  title,
  className = "",
  aspectClassName = "aspect-video",
}: FeatureVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  async function startPlayback() {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      await video.play();
      setStarted(true);
    } catch {
      /* Play may be blocked; user can retry via the play button. */
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg ring-1 ring-plum/10 ${aspectClassName} ${className}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        preload="metadata"
        playsInline
        controls={started}
        onPlay={() => setStarted(true)}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
      </video>

      {!started && (
        <>
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 960px"
            className="object-cover"
            aria-hidden="true"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-plum/55 via-plum/15 to-transparent"
          />
          <button
            type="button"
            onClick={startPlayback}
            className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2"
            aria-label={`Play video: ${title}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-plum shadow-md transition hover:scale-105 hover:bg-white sm:h-20 sm:w-20">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-1 h-7 w-7 sm:h-8 sm:w-8"
                aria-hidden="true"
              >
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
            </span>
          </button>
        </>
      )}
    </div>
  );
}
