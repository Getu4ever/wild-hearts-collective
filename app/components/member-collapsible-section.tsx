"use client";

import { useState } from "react";

export function MemberCollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10 rounded-sm border border-plum/10 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-plum">{title}</h2>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="text-sm font-semibold uppercase tracking-wider text-brand hover:underline"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open ? (
        children
      ) : (
        <p className="mt-3 text-sm text-muted">
          Hidden to keep your dashboard lighter.
        </p>
      )}
    </section>
  );
}
