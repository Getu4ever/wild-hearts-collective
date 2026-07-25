import Image from "next/image";
import { qualificationBadges } from "@/lib/team-data";

export function QualificationBadges() {
  const loop = [...qualificationBadges, ...qualificationBadges];

  return (
    <section
      aria-label="Instructor qualification badges"
      className="overflow-hidden border-y border-plum/10 bg-white py-10"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-plum/70">
          Certified qualifications
        </p>
      </div>

      <div className="relative mt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-24"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-24"
        />

        <div className="badge-marquee flex w-max gap-10 pr-10">
          {loop.map((badge, index) => (
            <div
              key={`${badge.src}-${index}`}
              className="flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32"
            >
              <Image
                src={badge.src}
                alt={index < qualificationBadges.length ? badge.alt : ""}
                width={160}
                height={160}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
