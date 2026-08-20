"use client";

import { useEffect, useId } from "react";

type AdminSavedDialogProps = {
  open: boolean;
  title?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onClose: () => void;
};

export function AdminSavedDialog({
  open,
  title = "Saved",
  description,
  confirmLabel = "OK",
  onClose,
}: AdminSavedDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-sage/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md rounded-lg border border-plum/10 bg-surface p-6 shadow-xl"
      >
        <div className="mb-4 h-px w-10 bg-pink" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage">
          Success
        </p>
        <h2 id={titleId} className="font-display text-2xl text-plum">
          {title}
        </h2>
        <div id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">
          {description}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-sm bg-sage px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-sage-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
