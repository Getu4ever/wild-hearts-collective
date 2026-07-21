"use client";

import { useEffect, useState } from "react";

type AnalyticsData = {
  summary: {
    occupancyPercent: number;
    totalSessions: number;
    totalBookings: number;
    activeStudents: number;
    retentionRate: number;
    classPacksSold: number;
    engagementEmailsSent: number;
    noShowsTracked: number;
  };
  popularClasses: Array<{
    slug: string;
    title: string;
    bookings: number;
    occupancyPercent: number;
  }>;
  peakHours: Array<{ hour: string; bookings: number }>;
  monthlyBookingTrend: Array<{ month: string; bookings: number }>;
  attendanceBreakdown: { attended: number; noShow: number };
  periodDays: number;
};

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? "Unable to load analytics.");
        }
        if (payload.error) throw new Error(payload.error);
        setData(payload);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load analytics."));
  }, []);

  if (error) {
    return <p className="text-sm text-brand">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted">Loading analytics…</p>;
  }

  const stats = [
    { label: "Occupancy", value: `${data.summary.occupancyPercent}%` },
    { label: "Confirmed bookings", value: String(data.summary.totalBookings) },
    { label: "Active students (30d)", value: String(data.summary.activeStudents) },
    { label: "Retention rate", value: `${data.summary.retentionRate}%` },
    { label: "Class packs sold", value: String(data.summary.classPacksSold) },
    { label: "Engagement emails", value: String(data.summary.engagementEmailsSent) },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-4xl text-plum">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display text-3xl text-plum">Popular classes</h2>
        <div className="mt-4 overflow-hidden rounded-sm border border-plum/10 bg-surface">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
              <tr>
                <th className="w-[55%] px-3 py-3">Class</th>
                <th className="w-[22%] px-3 py-3">Bookings</th>
                <th className="w-[23%] px-3 py-3">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {data.popularClasses.map((item) => (
                <tr key={item.slug} className="border-b border-plum/10">
                  <td className="px-3 py-3">
                    <p className="truncate font-medium text-plum" title={item.title}>
                      {item.title}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted">{item.bookings}</td>
                  <td className="px-3 py-3 text-muted">{item.occupancyPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-plum">Peak hours</h2>
          <ul className="mt-4 space-y-2">
            {data.peakHours.map((item) => (
              <li
                key={item.hour}
                className="flex items-center justify-between rounded-sm border border-plum/10 bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-plum">{item.hour}:00</span>
                <span className="text-muted">{item.bookings} bookings</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-3xl text-plum">Monthly bookings</h2>
          <ul className="mt-4 space-y-2">
            {data.monthlyBookingTrend.map((item) => (
              <li
                key={item.month}
                className="flex items-center justify-between rounded-sm border border-plum/10 bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-plum">{item.month}</span>
                <span className="text-muted">{item.bookings}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-plum">Attendance breakdown</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-sm text-muted">Attended</p>
            <p className="mt-2 font-display text-4xl text-plum">{data.attendanceBreakdown.attended}</p>
          </div>
          <div className="rounded-sm border border-plum/10 bg-surface p-6">
            <p className="text-sm text-muted">No shows</p>
            <p className="mt-2 font-display text-4xl text-plum">{data.attendanceBreakdown.noShow}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
