"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CLASS_TYPE_OPTIONS,
  getMaxCapacityForClassSlug,
} from "@/lib/admin-studio-config";

type Tutor = { id: string; name: string };
type ClassRecord = { slug: string; title: string; maxCapacity: number; duration: number };

type AdminSessionFormProps = {
  mode: "create" | "edit";
  sessionId?: string;
  initial?: {
    classSlug?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
    tutorId?: string | null;
    adminNotes?: string | null;
  };
};

export function AdminSessionForm({ mode, sessionId, initial }: AdminSessionFormProps) {
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classSlug, setClassSlug] = useState(initial?.classSlug ?? "pole");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "18:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [capacity, setCapacity] = useState(
    initial?.capacity ?? getMaxCapacityForClassSlug("pole"),
  );
  const [tutorId, setTutorId] = useState(initial?.tutorId ?? "");
  const [adminNotes, setAdminNotes] = useState(initial?.adminNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/tutors").then((r) => r.json()),
      fetch("/api/admin/classes").then((r) => r.json()),
    ]).then(([tutorData, classData]) => {
      setTutors(tutorData.tutors ?? []);
      setClasses(classData.classes ?? []);
    });
  }, []);

  useEffect(() => {
    const max = getMaxCapacityForClassSlug(classSlug);
    setCapacity((current) => Math.min(current, max));
  }, [classSlug]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url =
        mode === "create" ? "/api/admin/sessions" : `/api/admin/sessions/${sessionId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode === "create" ? { classSlug } : {}),
          date,
          startTime,
          endTime: endTime || undefined,
          capacity,
          tutorId: tutorId || null,
          adminNotes: adminNotes || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save session.");

      router.push(`/admin/sessions/${data.session.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save session.");
    } finally {
      setLoading(false);
    }
  }

  const maxCapacity = getMaxCapacityForClassSlug(classSlug);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Class type">
          <select
            value={classSlug}
            disabled={mode === "edit"}
            onChange={(event) => setClassSlug(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          >
            {CLASS_TYPE_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Start time">
          <input
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="End time (optional)">
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          />
        </Field>

        <Field label={`Capacity (max ${maxCapacity})`}>
          <input
            type="number"
            min={1}
            max={maxCapacity}
            required
            value={capacity}
            onChange={(event) => setCapacity(Number(event.target.value))}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Tutor">
          <select
            value={tutorId}
            onChange={(event) => setTutorId(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Admin notes">
        <textarea
          rows={3}
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          placeholder="Optional notes for the studio team"
        />
      </Field>

      {classes.length > 0 && mode === "create" && (
        <p className="text-xs text-muted">
          Equipment limit for this class type: {maxCapacity} students maximum.
        </p>
      )}

      {error && <p className="text-sm text-brand">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-plum px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand disabled:opacity-60"
      >
        {loading ? "Saving…" : mode === "create" ? "Schedule class" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-semibold text-plum">{label}</span>
      {children}
    </label>
  );
}
