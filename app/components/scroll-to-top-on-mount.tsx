"use client";

import { useEffect } from "react";

/** Ensures confirmation pages land at the top on mobile after payment redirects. */
export function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return null;
}
