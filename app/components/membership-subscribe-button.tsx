"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MembershipSubscribeButton() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data) => setSignedIn(Boolean(data.user)))
      .catch(() => setSignedIn(false));
  }, []);

  if (signedIn === null) {
    return (
      <div className="rounded-sm bg-sage/60 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white">
        Loading…
      </div>
    );
  }

  if (!signedIn) {
    return (
      <Link
        href="/register?plan=monthly"
        className="block w-full rounded-sm bg-sage px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
      >
        Subscribe monthly
      </Link>
    );
  }

  return (
    <Link
      href="/account/profile#billing"
      className="block w-full rounded-sm bg-sage px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-hover"
    >
      Subscribe monthly
    </Link>
  );
}
