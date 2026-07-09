"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PARQ_QUESTIONS, type ParQQuestionKey } from "@/lib/parq-config";

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-plum/10 bg-white px-4 py-4">
      <legend className="px-1 text-sm font-medium leading-relaxed text-plum">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { answer: false, label: "No" },
          { answer: true, label: "Yes" },
        ].map((option) => {
          const selected = value === option.answer;
          const id = `${label}-${option.label}`;

          return (
            <label
              key={option.label}
              htmlFor={id}
              className={`inline-flex min-w-[5.5rem] cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                selected
                  ? option.answer
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-plum bg-sage/10 text-plum"
                  : "border-plum/15 bg-surface text-muted hover:border-pink/40 hover:text-plum"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={label}
                checked={selected}
                onChange={() => onChange(option.answer)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ParQForm({ completed }: { completed?: boolean }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<ParQQuestionKey, boolean | null>>({
    hasHeartCondition: null,
    hasChestPain: null,
    hasBoneJointProblem: null,
    hasHighBloodPressure: null,
    hasOtherMedicalReason: null,
    isPregnant: null,
  });
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(completed ?? false);

  const allAnswered = PARQ_QUESTIONS.every((question) => answers[question.key] !== null);
  const anyYes = PARQ_QUESTIONS.some((question) => answers[question.key] === true);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!allAnswered) {
      setError("Please answer every question with Yes or No.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/members/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          emergencyContactName,
          emergencyContactPhone,
          additionalNotes,
          consentGiven,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save form.");

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save form.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm">
        <div className="bg-gradient-to-r from-sage to-sage/80 px-8 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-light">Complete</p>
          <h2 className="mt-2 font-display text-4xl">PAR-Q submitted</h2>
        </div>
        <div className="space-y-4 px-8 py-8">
          <p className="text-sm leading-relaxed text-muted">
            Thank you. You can now book pole, hoop, and silks classes. Please update this form if
            your health circumstances change.
          </p>
          <Link
            href="/book"
            className="inline-flex rounded-lg bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
          >
            Book a class
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-plum/10 bg-surface shadow-sm"
    >
      <div className="border-b border-plum/8 bg-pink-soft/40 px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Physical Activity Readiness Questionnaire
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Before participating in aerial or pole classes, answer each question with{" "}
          <strong className="text-plum">Yes</strong> or <strong className="text-plum">No</strong>.
          If you answer yes to any question, please{" "}
          <Link href="/contact" className="font-semibold text-brand hover:underline">
            contact us
          </Link>{" "}
          before booking.
        </p>
      </div>

      <div className="space-y-4 px-6 py-8 sm:px-8">
        {PARQ_QUESTIONS.map((question) => (
          <YesNoQuestion
            key={question.key}
            label={question.label}
            value={answers[question.key]}
            onChange={(next) =>
              setAnswers((current) => ({
                ...current,
                [question.key]: next,
              }))
            }
          />
        ))}

        {anyYes && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            You answered yes to at least one question. You may still submit the form, but please
            speak with us before attending class so we can advise you safely.
          </p>
        )}

        <div className="grid gap-4 border-t border-plum/10 pt-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-plum">
              Emergency contact name <span className="text-brand">*</span>
            </label>
            <input
              required
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-plum/15 px-4 py-3 text-sm shadow-sm focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-plum">
              Emergency contact phone <span className="text-brand">*</span>
            </label>
            <input
              required
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value)}
              className="mt-2 w-full rounded-lg border border-plum/15 px-4 py-3 text-sm shadow-sm focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-plum">Additional notes (optional)</label>
          <textarea
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
            rows={4}
            placeholder="Anything else we should know for your safety in class"
            className="mt-2 w-full rounded-lg border border-plum/15 px-4 py-3 text-sm shadow-sm focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-plum/10 bg-pink-soft/30 px-4 py-4 text-sm text-plum">
          <input
            type="checkbox"
            required
            checked={consentGiven}
            onChange={(event) => setConsentGiven(event.target.checked)}
            className="mt-1"
          />
          <span>
            I confirm the information provided is accurate and I understand I should seek advice
            from a health professional if I am unsure about my ability to participate safely.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-brand/20 bg-pink-light px-4 py-3 text-sm text-plum" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !allAnswered}
          className="w-full rounded-lg bg-sage px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-sage/15 transition hover:bg-sage-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Saving…" : "Submit PAR-Q"}
        </button>
      </div>
    </form>
  );
}
