"use client";

import { useState } from "react";

export function MemberCollapsibleSection({
  title,
  children,
  defaultOpen = false,
  collapsedHint = "Hidden to keep your dashboard lighter. Tap show to expand.",
  className = "mt-10 rounded-sm border border-plum/10 bg-surface p-6",
  headingClassName = "font-display text-2xl text-plum",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsedHint?: string;
  className?: string;
  headingClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className={headingClassName}>{title}</h2>
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
        <p className="mt-3 text-sm text-muted">{collapsedHint}</p>
      )}
    </section>
  );
}
