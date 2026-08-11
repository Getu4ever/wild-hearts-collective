"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_KEY = "cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  }

  function deny() {
    localStorage.setItem(COOKIE_KEY, "essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row">
        <Image
          src="/logo/logo-header-white.png"
          alt="Wild Hearts Collective"
          width={40}
          height={36}
          className="logo-header-accent hidden shrink-0 sm:block"
        />

        <div className="flex-1 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">This website uses cookies</p>
          <p className="mt-0.5">
            We use cookies to keep the site working, understand traffic, and improve our services.
            You can accept all, refuse non-essential cookies, or customise your choices.{" "}
            <Link href="/cookie-policy" className="font-semibold underline">
              Cookie Policy
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={deny}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Deny
          </button>
          <button
            onClick={deny}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Customise
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-plum px-4 py-1.5 text-sm font-medium text-white transition hover:bg-plum-hover"
          >
            Allow all
          </button>
        </div>
      </div>
    </div>
  );
}
