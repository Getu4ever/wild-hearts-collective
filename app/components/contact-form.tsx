"use client";

import { useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-sm border border-plum/15 px-4 py-2.5 text-sm text-foreground focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/30";

export function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          subject: String(data.get("subject") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send your message.");
      }

      setSent(true);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="rounded-sm border border-sage/40 bg-sage-light p-8 shadow-sm"
        role="status"
      >
        <h2 className="font-display text-3xl text-plum">Message sent</h2>
        <p className="mt-4 text-sm leading-relaxed text-foreground">
          Thank you for getting in touch. Your message has been sent, and we have
          emailed you a confirmation. We will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError("");
          }}
          className="mt-6 rounded-sm border border-plum/15 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-plum transition hover:border-pink hover:text-brand"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-sm border border-plum/10 bg-surface p-8 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="font-display text-3xl text-plum">Send a message</h2>
      {error ? (
        <p
          className="mt-4 rounded-sm border border-brand/30 bg-pink-soft px-4 py-3 text-sm text-brand"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground">
            Subject
          </label>
          <select id="subject" name="subject" className={fieldClass}>
            <option>General enquiry</option>
            <option>Class booking help</option>
            <option>Party booking</option>
            <option>Studio hire</option>
          </select>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            maxLength={4000}
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-sage-hover disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
