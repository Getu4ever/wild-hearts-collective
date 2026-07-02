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
      className={`transition hover:text-pink-light ${
        onDark ? "text-white/85 hover:text-white" : "text-plum/80 hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );
}

function TopBarSeparator({ onDark }: { onDark?: boolean }) {
  return (
    <span className={onDark ? "text-white/30" : "text-plum/25"} aria-hidden="true">
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
          ? "border-white/10 bg-plum/95 text-white backdrop-blur-sm"
          : "border-plum/10 bg-pink-soft/80 text-plum backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-2 md:px-6">
        {!loaded ? (
          <span className={onDark ? "text-white/40" : "text-plum/40"}>Loading…</span>
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
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-pink/10 p-4 shadow-lg shadow-black/10 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink/90 text-[11px] font-bold text-plum shadow-sm"
          aria-hidden="true"
        >
          ♥
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-pink-light">
            Member access
          </p>
          <p className="text-[12px] leading-snug text-white/65">
            Book, manage, and grow with us
          </p>
        </div>
      </div>

      <nav aria-label="Member access" className="mt-4 flex flex-col gap-2">
        <Link
          href="/membership"
          className="group inline-flex w-full items-center justify-between rounded-full bg-pink px-4 py-2 text-xs font-bold uppercase tracking-wide text-plum shadow-lg shadow-pink/20 transition hover:bg-pink-light hover:shadow-pink/30"
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
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-pink hover:bg-white/15 hover:text-pink-light"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 bg-plum/40 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-pink hover:bg-plum/55 hover:text-pink-light"
          >
            Login
          </Link>
        </div>
      </nav>
    </div>
  );
}
