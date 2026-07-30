"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminCapacityBadge, occupancyBarClass } from "@/app/components/admin-capacity-badge";
import { AdminQuickCapacityEdit } from "@/app/components/admin-quick-capacity-edit";
import {
  CLASS_TYPE_OPTIONS,
  formatSessionTimeRange,
  getOccupancyLevel,
  SESSION_STATUS,
} from "@/lib/admin-studio-config";
import type { AdminScheduleRange } from "@/lib/admin-session-service";

export type AdminScheduleSession = {
  id: string;
  classSlug: string;
  classTitle: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  spotsLeft: number;
  occupancyLevel: string;
  status: string;
  tutor: { id: string; name: string } | null;
  unmarkedAttendanceCount?: number;
  needsCheckIn?: boolean;
  hasStarted?: boolean;
  hasEnded?: boolean;
  courseSeriesId?: string | null;
  courseWeek?: number | null;
};

const rangeTabs: { value: AdminScheduleRange; label: string }[] = [
  { value: "schedule", label: "Today & upcoming" },
  { value: "today", label: "Today only" },
  { value: "past", label: "Past 14 days" },
];

export function AdminScheduleBoard({
  sessions,
  range = "schedule",
}: {
  sessions: AdminScheduleSession[];
  range?: AdminScheduleRange;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const classTypes = CLASS_TYPE_OPTIONS.map((option) => [
    option.slug,
    option.title,
  ] as const);

  const filtered =
    filter === "all"
      ? sessions
      : sessions.filter((session) => session.classSlug === filter);

  const needsCheckInCount = filtered.filter((session) => session.needsCheckIn).length;

  const grouped = filtered.reduce<Record<string, AdminScheduleSession[]>>(
    (acc, session) => {
      const day = new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/London",
      }).format(new Date(session.startsAt));

      if (!acc[day]) acc[day] = [];
      acc[day].push(session);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {rangeTabs.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "schedule"
                ? "/admin/schedule"
                : `/admin/schedule?range=${tab.value}`
            }
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              range === tab.value
                ? "bg-plum text-white"
                : "border border-plum/15 bg-white text-plum hover:border-pink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {needsCheckInCount > 0 && (
        <p className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-plum">
          <strong className="font-semibold">{needsCheckInCount}</strong>{" "}
          {needsCheckInCount === 1 ? "class needs" : "classes need"} check-in — open the
          roster and mark attended / no show before analytics drift.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            All classes
          </FilterButton>
          {classTypes.map(([slug, title]) => (
            <FilterButton
              key={slug}
              active={filter === slug}
              onClick={() => setFilter(slug)}
            >
              {title}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-sm border border-plum/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink"
          >
            Refresh
          </button>
          <Link
            href="/admin/sessions/new"
            className="rounded-sm bg-sage px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
          >
            Add class
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-plum/15 px-6 py-12 text-center text-sm text-muted">
          {range === "past"
            ? "No sessions in the past 14 days for this filter."
            : range === "today"
              ? "No sessions scheduled today."
              : "No sessions in this view."}
        </p>
      ) : (
        Object.entries(grouped).map(([day, daySessions]) => (
          <section key={day}>
            <h2 className="font-display text-2xl text-plum">{day}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {daySessions.map((session) => {
                const level = getOccupancyLevel(
                  session.confirmedCount,
                  session.capacity,
                  session.status,
                );
                const fillPercent = Math.min(
                  100,
                  Math.round((session.confirmedCount / session.capacity) * 100),
                );
                const cancelled = session.status === SESSION_STATUS.cancelled;

                return (
                  <article
                    key={session.id}
                    className={`rounded-lg border bg-surface p-5 shadow-sm ${
                      session.needsCheckIn
                        ? "border-brand/40 ring-1 ring-brand/20"
                        : cancelled
                          ? "border-plum/10 opacity-70"
                          : "border-plum/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-plum">
                          {session.classTitle}
                          {session.courseWeek
                            ? ` · Week ${session.courseWeek}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatSessionTimeRange(
                            new Date(session.startsAt),
                            session.endsAt ? new Date(session.endsAt) : null,
                          )}
                          {session.hasEnded ? " · Finished" : session.hasStarted ? " · In progress" : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Tutor:{" "}
                          <span className="font-medium text-plum">
                            {session.tutor?.name ?? "Unassigned"}
                          </span>
                        </p>
                        {session.needsCheckIn ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand">
                            Needs check-in ({session.unmarkedAttendanceCount} unmarked)
                          </p>
                        ) : null}
                      </div>
                      <AdminCapacityBadge
                        confirmed={session.confirmedCount}
                        capacity={session.capacity}
                        status={session.status}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-sage/10">
                        <div
                          className={`h-full rounded-full transition-all ${occupancyBarClass(level)}`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        {session.waitlistCount > 0
                          ? `${session.waitlistCount} on waitlist · `
                          : ""}
                        {session.spotsLeft} spots left
                      </p>
                      {!session.hasEnded && (
                        <AdminQuickCapacityEdit
                          sessionId={session.id}
                          classSlug={session.classSlug}
                          capacity={session.capacity}
                        />
                      )}
                    </div>

                    {!cancelled && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/sessions/${session.id}`}
                          className="rounded-sm bg-sage px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
                        >
                          View roster
                        </Link>
                        {!session.hasEnded && (
                          <Link
                            href={`/admin/sessions/${session.id}#edit`}
                            className="rounded-sm border border-plum/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
        active
          ? "bg-sage text-white"
          : "border border-plum/15 bg-white text-plum hover:border-pink"
      }`}
    >
      {children}
    </button>
  );
}
