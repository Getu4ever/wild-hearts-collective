"use client";

import { useState } from "react";
import Link from "next/link";
import { TEAMUP_BOOKING_URL } from "@/lib/constants";
import { siteConfig, timetable } from "@/lib/site-data";

export function Timetable() {
  const [activeDay, setActiveDay] = useState(0);
  const active = timetable[activeDay];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {timetable.map((day, index) => (
          <button
            key={day.day}
            type="button"
            onClick={() => setActiveDay(index)}
            className={`rounded-sm px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${
              activeDay === index
                ? "bg-sage text-white"
                : "bg-surface text-foreground hover:bg-pink-soft"
            }`}
          >
            {day.day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-display text-3xl text-plum">{active.day}</h3>
        <ul className="mt-6 space-y-4">
          {active.classes.map((item) => (
            <li
              key={item.title}
              className="rounded-sm border border-plum/10 bg-surface p-6"
            >
              <Link href={TEAMUP_BOOKING_URL} className="group block">
                <p className="text-sm font-semibold uppercase tracking-wider text-pink">
                  {item.time}
                </p>
                <h4 className="mt-2 font-display text-2xl text-plum group-hover:text-pink">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-muted">
        {siteConfig.bookingNote}{" "}
        <Link href={TEAMUP_BOOKING_URL} className="font-semibold text-plum hover:text-pink hover:underline">
          Book here!
        </Link>
      </p>
      <p className="mt-3 text-sm text-muted">{siteConfig.levelNote}</p>
      <p className="mt-3 text-sm text-muted">{siteConfig.arrivalNote}</p>
    </div>
  );
}
