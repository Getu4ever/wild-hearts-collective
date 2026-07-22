import type { ReactNode } from "react";

type ComingSoonOverlayProps = {
  children: ReactNode;
  label?: string;
  detail?: string;
};

export function ComingSoonOverlay({
  children,
  label = "Coming Soon",
  detail = "Available at a later date",
}: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[5px]" aria-hidden="true">
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-cream/25 backdrop-blur-[2px]"
        role="status"
        aria-label={`${label}. ${detail}`}
      >
        <div className="rounded-sm border border-plum/15 bg-surface/95 px-8 py-5 text-center shadow-md">
          <p className="font-display text-3xl text-plum">{label}</p>
          {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
        </div>
      </div>
    </div>
  );
}
