import Image from "next/image";
import Link from "next/link";
import { BOOKING_URL } from "@/lib/constants";
import {
  timetable as defaultTimetable,
  type TimetableClass,
  type TimetableDay,
} from "@/lib/site-data";

/** Poster pixel size of public/Timetable.png — keep overlays in sync with this. */
const POSTER_W = 941;
const POSTER_H = 1672;

/**
 * Overlay boxes as % of the full uncropped poster.
 * Calibrated so HTML covers baked-in day/class text only —
 * header (script “Timetable” + aerial logo), leaves, and heart dividers stay pure PNG.
 */
const DAY_REGIONS = [
  { top: 25.7, height: 14.4 }, // Monday
  { top: 40.0, height: 12.7 }, // Tuesday
  { top: 52.6, height: 12.6 }, // Wednesday
  { top: 65.1, height: 10.6 }, // Thursday
  { top: 75.6, height: 8.8 }, // Friday
  { top: 84.3, height: 6.1 }, // Saturday
  { top: 90.3, height: 4.2 }, // Sunday — leave space above the bottom heart motif
] as const;

const CARD_LEFT = 10.1;
const CARD_WIDTH = 82.4;
/** Matches the cream fill inside the PNG day cards. */
const CARD_CREAM = "#fbf8f2";
const INK = "#4a5d4e";

/** Public display only — admin/data can keep full day names. */
const DAY_SHORT_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function shortDayLabel(day: string) {
  const key = day.trim().toLowerCase();
  return DAY_SHORT_LABELS[key] ?? day.slice(0, 3);
}

function bookHref(item: TimetableClass) {
  if (item.bookClassSlug) return `${BOOKING_URL}?class=${item.bookClassSlug}`;
  return BOOKING_URL;
}

function DayOverlay({
  day,
  region,
}: {
  day: TimetableDay;
  region: (typeof DAY_REGIONS)[number];
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-[2.2cqw] border border-[#d7d0c4]/90"
      style={{
        top: `${region.top}%`,
        left: `${CARD_LEFT}%`,
        width: `${CARD_WIDTH}%`,
        height: `${region.height}%`,
        backgroundColor: CARD_CREAM,
      }}
    >
      <div
        className={`flex h-full min-h-0 items-stretch gap-[2cqw] px-[2.4cqw] ${
          region.height <= 5 ? "py-[0.45cqw]" : "py-[1.6cqw]"
        }`}
      >
        <p
          className="flex w-[14cqw] shrink-0 items-center text-[2.85cqw] font-semibold uppercase leading-tight tracking-[0.08em]"
          style={{ color: INK, fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {shortDayLabel(day.day)}
        </p>
        <div
          className="w-px shrink-0 self-stretch opacity-50"
          style={{ backgroundColor: INK }}
          aria-hidden
        />
        <ul className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-[0.35cqw] overflow-hidden">
          {day.classes.map((item, index) => {
            const href = bookHref(item);
            const hasTime = Boolean(item.time?.trim());
            return (
              <li key={`${day.day}-${index}-${item.title}`} className="min-w-0">
                <Link
                  href={href}
                  className="group block rounded-[0.6cqw] outline-none transition hover:bg-[#efe8dc]/80 focus-visible:ring-2 focus-visible:ring-sage/35"
                >
                  <div
                    className="flex min-w-0 items-baseline gap-[1.4cqw] px-[0.4cqw] py-[0.25cqw]"
                    style={{
                      color: INK,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}
                  >
                    {hasTime ? (
                      <span className="w-[22cqw] shrink-0 text-[2.45cqw] tabular-nums leading-snug tracking-wide">
                        {item.time}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 text-[2.55cqw] leading-snug group-hover:underline">
                      {item.title}
                    </span>
                  </div>
                  {item.note ? (
                    <p
                      className="px-[0.4cqw] pb-[0.35cqw] text-[1.9cqw] italic leading-snug opacity-80"
                      style={{
                        color: INK,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        paddingLeft: hasTime ? "calc(22cqw + 1.4cqw + 0.4cqw)" : undefined,
                      }}
                    >
                      ({item.note.replace(/^\(|\)$/g, "")})
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Marketing timetable: full uncropped Timetable.png poster (exact header +
 * botanical frame) with editable day/class overlays from Admin → Timetable.
 */
export function Timetable({
  days = defaultTimetable,
}: {
  days?: TimetableDay[];
}) {
  const overlayDays = days.slice(0, DAY_REGIONS.length);
  const promotionalRows = days.slice(DAY_REGIONS.length);

  return (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="sr-only">Timetable</h2>

      <div
        className="relative w-full overflow-hidden rounded-sm shadow-[0_12px_40px_-24px_rgba(74,67,60,0.45)]"
        style={{
          aspectRatio: `${POSTER_W} / ${POSTER_H}`,
          containerType: "inline-size",
          backgroundColor: CARD_CREAM,
        }}
      >
        <Image
          src="/Timetable.png"
          alt="Wild Hearts Collective weekly class timetable"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 36rem"
          className="pointer-events-none object-contain object-top"
          // Full poster — never crop title, logo, or botanical frame.
        />

        {/* Editable schedule only — PNG header / leaves / dividers stay visible */}
        {overlayDays.map((day, index) => (
          <DayOverlay
            key={`${day.day}-${index}`}
            day={day}
            region={DAY_REGIONS[index]!}
          />
        ))}
      </div>

      {promotionalRows.length > 0 && (
        <section className="mt-5 space-y-3" aria-label="Upcoming courses and special events">
          {promotionalRows.map((row, index) => (
            <div
              key={`${row.day}-${index}`}
              className="rounded-sm border border-plum/10 bg-white/70 px-5 py-4 text-left shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {row.day}
              </p>
              <ul className="mt-2 space-y-1.5">
                {row.classes.map((item, classIndex) => (
                  <li key={`${item.title}-${classIndex}`} className="text-sm text-plum">
                    <Link href={bookHref(item)} className="font-semibold hover:underline">
                      {item.time ? `${item.time} · ` : ""}{item.title}
                    </Link>
                    {item.note ? <span className="text-muted"> — {item.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Weekly studio pattern above. Tap a class for live bookable sessions — tutors,
          one-offs, and availability are in the booking schedule.
        </p>
        <Link
          href={BOOKING_URL}
          className="inline-flex shrink-0 rounded-sm bg-sage px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
        >
          Book a class
        </Link>
      </div>
    </div>
  );
}
