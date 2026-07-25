"use client";

import { useState } from "react";
import Link from "next/link";

type FeedbackFormProps = {
  token: string;
  name: string;
  classTitle: string | null;
  alreadySubmitted: boolean;
};

export function ClassFeedbackForm({
  token,
  name,
  classTitle,
  alreadySubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [shareOnWebsite, setShareOnWebsite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(alreadySubmitted);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comments, shareOnWebsite }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send feedback.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send feedback.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-plum/10 bg-surface p-8 shadow-sm">
        <h2 className="font-display text-3xl text-plum">Thank you</h2>
        <p className="mt-4 text-muted">
          Your feedback has been received
          {shareOnWebsite
            ? " — and noted that we may share it on the website"
            : ""}
          . We appreciate you taking the time.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-sm bg-sage px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-plum/10 bg-surface p-8 shadow-sm"
    >
      <h2 className="font-display text-3xl text-plum">How was your class?</h2>
      <p className="mt-3 text-sm text-muted">
        Hi {name}
        {classTitle ? (
          <>
            {" "}
            — feedback for <strong className="text-plum">{classTitle}</strong>
          </>
        ) : null}
        .
      </p>

      <fieldset className="mt-8">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
          Rating
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`h-11 w-11 rounded-sm text-sm font-semibold transition ${
                rating === value
                  ? "bg-sage text-white"
                  : "border border-plum/15 bg-white text-plum hover:border-sage"
              }`}
              aria-pressed={rating === value}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">1 = poor · 5 = excellent</p>
      </fieldset>

      <label className="mt-8 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Your review
        </span>
        <textarea
          rows={5}
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="What did you enjoy? Anything we could improve?"
          className="mt-2 w-full rounded-sm border border-plum/15 bg-white px-4 py-3 text-sm text-plum outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
      </label>

      <label className="mt-6 flex items-start gap-3 rounded-xl border border-plum/10 bg-sage-light/40 px-4 py-4 text-sm text-plum">
        <input
          type="checkbox"
          checked={shareOnWebsite}
          onChange={(event) => setShareOnWebsite(event.target.checked)}
          className="mt-1"
        />
        <span>
          I am happy for Wild Hearts Collective to share this review on the
          website.
        </span>
      </label>

      {error && (
        <p className="mt-4 text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-8 w-full rounded-sm bg-sage px-5 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
