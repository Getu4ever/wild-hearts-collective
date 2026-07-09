"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminCapacityBadge, occupancyBarClass } from "@/app/components/admin-capacity-badge";
import { AdminQuickCapacityEdit } from "@/app/components/admin-quick-capacity-edit";
import {
  formatSessionTimeRange,
  getOccupancyLevel,
  SESSION_STATUS,
} from "@/lib/admin-studio-config";
import { formatSessionDateTime } from "@/lib/booking-config";

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
};

export function AdminScheduleBoard({
  sessions,
}: {
  sessions: AdminScheduleSession[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const classTypes = Array.from(
    new Map(sessions.map((s) => [s.classSlug, s.classTitle])).entries(),
  );

  const filtered =
    filter === "all"
      ? sessions
      : sessions.filter((session) => session.classSlug === filter);

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
            className="rounded-sm bg-plum px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
          >
            Add class
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-plum/15 px-6 py-12 text-center text-sm text-muted">
          No upcoming sessions in this view.
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
                      cancelled ? "border-plum/10 opacity-70" : "border-plum/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-plum">{session.classTitle}</p>
                        <p className="mt-1 text-sm text-muted">
                          {formatSessionTimeRange(
                            new Date(session.startsAt),
                            session.endsAt ? new Date(session.endsAt) : null,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Tutor:{" "}
                          <span className="font-medium text-plum">
                            {session.tutor?.name ?? "Unassigned"}
                          </span>
                        </p>
                      </div>
                      <AdminCapacityBadge
                        confirmed={session.confirmedCount}
                        capacity={session.capacity}
                        status={session.status}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-plum/10">
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
                      <AdminQuickCapacityEdit
                        sessionId={session.id}
                        classSlug={session.classSlug}
                        capacity={session.capacity}
                      />
                    </div>

                    {!cancelled && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/sessions/${session.id}`}
                          className="rounded-sm bg-plum px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand"
                        >
                          View roster
                        </Link>
                        <Link
                          href={`/admin/sessions/${session.id}#edit`}
                          className="rounded-sm border border-plum/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-plum hover:border-pink"
                        >
                          Edit
                        </Link>
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
          ? "bg-plum text-white"
          : "border border-plum/15 bg-white text-plum hover:border-pink"
      }`}
    >
      {children}
    </button>
  );
}
