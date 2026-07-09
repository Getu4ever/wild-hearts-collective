"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { memberAccessLinks } from "@/lib/site-data";

type MemberSummary = {
  name: string;
};

function TopBarLink({
  href,
  label,
  onDark,
}: {
  href: string;
  label: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`transition ${
        onDark
          ? "text-white/90 hover:text-white"
          : "text-white/90 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function TopBarSeparator({ onDark }: { onDark?: boolean }) {
  return (
    <span className="text-white/35" aria-hidden="true">
      |
    </span>
  );
}

export function MemberTopBar({ overlayMode }: { overlayMode?: boolean }) {
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setMember(data.user ?? null);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onDark = !overlayMode;

  return (
    <div
      className={`border-b text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
        onDark
          ? "border-sage-hover/30 bg-sage text-white"
          : "border-white/10 bg-black/20 text-white backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-2 md:px-6">
        {!loaded ? (
          <span className="text-white/50">Loading…</span>
        ) : member ? (
          <>
            <TopBarLink href="/membership" label="Membership" onDark={onDark} />
            <TopBarSeparator onDark={onDark} />
            <TopBarLink href="/account" label="Account" onDark={onDark} />
          </>
        ) : (
          <>
            {memberAccessLinks.map((link, index) => (
              <span key={link.href} className="flex items-center gap-3">
                {index > 0 && <TopBarSeparator onDark={onDark} />}
                <TopBarLink href={link.href} label={link.label} onDark={onDark} />
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function FooterMemberLinks() {
  return (
    <div className="mt-5 overflow-hidden rounded-sm border border-plum/10 bg-white/70 p-4">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sage-light text-[11px] font-bold text-sage"
          aria-hidden="true"
        >
          ♥
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sage">
            Member access
          </p>
          <p className="text-[12px] leading-snug text-muted">
            Book, manage, and grow with us
          </p>
        </div>
      </div>

      <nav aria-label="Member access" className="mt-4 flex flex-col gap-2">
        <Link
          href="/membership"
          className="group inline-flex w-full items-center justify-between rounded-sm bg-sage px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-sage-hover"
        >
          <span>Membership</span>
          <span
            className="text-base transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            →
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/register"
            className="rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-plum transition hover:border-sage hover:text-sage"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-sm border border-plum/15 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-plum transition hover:border-sage hover:text-sage"
          >
            Login
          </Link>
        </div>
      </nav>
    </div>
  );
}
