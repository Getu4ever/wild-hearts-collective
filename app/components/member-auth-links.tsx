"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MemberSummary = {
  name: string;
};

export function MemberAuthLinks({ overlayMode }: { overlayMode: boolean }) {
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

  if (!loaded) return null;

  const linkClass = overlayMode
    ? "text-white/90 transition hover:text-white"
    : "text-white/90 transition hover:text-white";

  if (member) {
    return (
      <Link href="/account" className={linkClass}>
        Account
      </Link>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Member login
    </Link>
  );
}

export function MemberAuthMobileLink({ close }: { close: () => void }) {
  const [member, setMember] = useState<MemberSummary | null>(null);

  useEffect(() => {
    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data) => setMember(data.user ?? null))
      .catch(() => undefined);
  }, []);

  return (
    <Link
      href={member ? "/account" : "/login"}
      onClick={close}
      className="block rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
    >
      {member ? "My account" : "Member login"}
    </Link>
  );
}
