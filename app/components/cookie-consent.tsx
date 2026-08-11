"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_KEY = "cookie_consent";

type CookiePrefs = {
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  function save(value: string) {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  }

  function saveCustom() {
    const value = [
      "essential",
      prefs.analytics && "analytics",
      prefs.marketing && "marketing",
    ]
      .filter(Boolean)
      .join(",");
    save(value);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
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
              onClick={() => save("essential")}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Deny
            </button>
            <button
              onClick={() => setShowCustomise(!showCustomise)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Customise
            </button>
            <button
              onClick={() => save("all")}
              className="rounded-md bg-plum px-4 py-1.5 text-sm font-medium text-white transition hover:bg-plum-hover"
            >
              Allow all
            </button>
          </div>
        </div>

        {showCustomise && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" checked disabled className="accent-plum" />
                Essential (always on)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                  className="accent-plum"
                />
                Analytics
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                  className="accent-plum"
                />
                Marketing
              </label>
              <button
                onClick={saveCustom}
                className="ml-auto rounded-md bg-plum px-4 py-1.5 text-sm font-medium text-white transition hover:bg-plum-hover"
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
