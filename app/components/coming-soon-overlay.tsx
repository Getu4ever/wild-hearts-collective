import type { ReactNode } from "react";

type ComingSoonOverlayProps = {
  children: ReactNode;
  eyebrow?: string;
  label?: string;
  detail?: string;
};

export function ComingSoonOverlay({
  children,
  eyebrow,
  label = "Coming Soon",
  detail = "Available at a later date",
}: ComingSoonOverlayProps) {
  const ariaLabel = [eyebrow, label, detail].filter(Boolean).join(". ");

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[5px]" aria-hidden="true">
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-cream/25 backdrop-blur-[2px]"
        role="status"
        aria-label={ariaLabel}
      >
        <div className="rounded-sm border border-plum/15 bg-surface/95 px-8 py-5 text-center shadow-md">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {eyebrow}
            </p>
          )}
          <p className={`font-display text-3xl text-plum ${eyebrow ? "mt-1" : ""}`}>
            {label}
          </p>
          {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
        </div>
      </div>
    </div>
  );
}
