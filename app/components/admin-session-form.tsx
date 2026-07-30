"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CLASS_TYPE_OPTIONS,
  getMaxCapacityForClassSlug,
} from "@/lib/admin-studio-config";

type Tutor = { id: string; name: string };
type ClassRecord = {
  slug: string;
  title: string;
  maxCapacity: number;
  duration: number;
  creditCost?: number;
  pricePence?: number | null;
};

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
    publicDescription?: string | null;
    pricePence?: number | null;
    creditCost?: number | null;
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
  const [publicDescription, setPublicDescription] = useState(
    initial?.publicDescription ?? "",
  );
  const [pricePounds, setPricePounds] = useState(
    initial?.pricePence != null ? (initial.pricePence / 100).toFixed(2) : "",
  );
  const [creditCost, setCreditCost] = useState(
    initial?.creditCost != null ? String(initial.creditCost) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/tutors").then((r) => r.json()),
      fetch("/api/admin/classes").then((r) => r.json()),
    ]).then(([tutorData, classData]) => {
      const loaded = (tutorData.tutors ?? []) as Tutor[];
      // Keep a currently assigned (possibly inactive) tutor visible in the dropdown.
      if (
        initial?.tutorId &&
        !loaded.some((tutor) => tutor.id === initial.tutorId)
      ) {
        fetch(`/api/admin/tutors/${initial.tutorId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.tutor) {
              setTutors([
                ...loaded,
                {
                  id: data.tutor.id,
                  name: `${data.tutor.name}${data.tutor.active ? "" : " (inactive)"}`,
                },
              ]);
            } else {
              setTutors(loaded);
            }
          })
          .catch(() => setTutors(loaded));
      } else {
        setTutors(loaded);
      }
      setClasses(classData.classes ?? []);
    });
  }, [initial?.tutorId]);

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
          publicDescription: publicDescription || null,
          pricePounds: pricePounds.trim() === "" ? null : pricePounds,
          creditCost: creditCost.trim() === "" ? null : creditCost,
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
  const selectedClass = classes.find((item) => item.slug === classSlug);

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
            {(["Studio", "Juniors", "Workshops", "Courses"] as const).map(
              (group) => (
                <optgroup key={group} label={group}>
                  {CLASS_TYPE_OPTIONS.filter(
                    (option) => option.filterGroup === group,
                  ).map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
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
          <p className="mt-1 text-xs text-muted">
            Leave blank to use the class default (
            {selectedClass?.duration ?? 60} minutes). Set an end time for longer
            sessions (e.g. 1.5 hours).
          </p>
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

        <Field label="Price for this session (£)">
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={pricePounds}
            onChange={(event) => setPricePounds(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
            placeholder="Leave blank for studio default"
          />
          <p className="mt-1 text-xs text-muted">
            Optional override. Blank uses the studio drop-in / course price.
          </p>
        </Field>

        <Field label="Class credits used">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={creditCost}
            onChange={(event) => setCreditCost(event.target.value)}
            className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
            placeholder="Leave blank for 1 credit"
          />
          <p className="mt-1 text-xs text-muted">
            e.g. 1.5 for a 90-minute class. Blank defaults to{" "}
            {selectedClass?.creditCost ?? 1}.
          </p>
        </Field>
      </div>

      <Field label="Public description">
        <textarea
          rows={3}
          value={publicDescription}
          onChange={(event) => setPublicDescription(event.target.value)}
          className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          placeholder="Shown on the booking page for this session (optional)"
        />
      </Field>

      <Field label="Admin notes">
        <textarea
          rows={3}
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          className="w-full rounded-sm border border-plum/15 px-3 py-2 text-sm"
          placeholder="Private notes for the studio team only"
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
        className="rounded-sm bg-sage px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand disabled:opacity-60"
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
