"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOOKING_URL } from "@/lib/constants";
import {
  aboutMenuLinks,
  classMenuLinks,
  contact,
  mainNavLinks,
  type ClassMenuIcon,
} from "@/lib/site-data";
import { MemberTopBar } from "./member-top-bar";
import { HEADER_LOGO_HEIGHT, HEADER_LOGO_SRC, HEADER_LOGO_WIDTH } from "./logo";

const phoneHref = contact.phone.startsWith("Phone")
  ? "/contact"
  : `tel:${contact.phone.replace(/\s/g, "")}`;

const dropdownPanelClass = "classes-dropdown-panel rounded-2xl ring-1 ring-plum/10";

const SCROLL_THRESHOLD = 32;

const classMenuSections = [
  "Studio classes",
  "Wild Hearts Juniors",
  "Workshops",
  "Courses",
  "Browse",
] as const;

function ClassMenuIcon({ icon }: { icon: ClassMenuIcon }) {
  const className = "h-4 w-4 shrink-0 text-header-accent/75";

  switch (icon) {
    case "pole":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <path strokeLinecap="round" d="M12 3v18M9 6h6M9 18h6" />
          <circle cx="12" cy="8" r="2.5" />
        </svg>
      );
    case "hoop":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <circle cx="12" cy="10" r="6.5" />
          <path strokeLinecap="round" d="M8 18l-2 3M16 18l2 3" />
        </svg>
      );
    case "silks":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <path strokeLinecap="round" d="M8 3c0 4 1 8 4 11M16 3c0 4-1 8-4 11" />
          <path strokeLinecap="round" d="M12 14v7" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );
    case "arts":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <path strokeLinecap="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path strokeLinecap="round" d="M5 19c1.5-2 3.5-3 7-3s5.5 1 7 3" />
        </svg>
      );
    case "family":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <circle cx="9" cy="7" r="2.5" />
          <circle cx="16" cy="8" r="2" />
          <path strokeLinecap="round" d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
          <path strokeLinecap="round" d="M13 14.5c1.2-1.4 2.8-2 4.5-2 2.2 0 4 1.4 4.5 3.5" />
        </svg>
      );
    case "teens":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <circle cx="12" cy="7" r="3" />
          <path strokeLinecap="round" d="M5 20c1.2-3.5 3.8-5.5 7-5.5s5.8 2 7 5.5" />
        </svg>
      );
    case "children":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <circle cx="12" cy="8" r="2.75" />
          <path strokeLinecap="round" d="M7 20c.8-3 2.8-4.5 5-4.5s4.2 1.5 5 4.5" />
          <path strokeLinecap="round" d="M8 4.5c.4-.8 1.2-1.3 2-1.3M16 4.5c-.4-.8-1.2-1.3-2-1.3" />
        </svg>
      );
    case "workshop":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <path strokeLinecap="round" d="M4 19h16M7 19V9l5-4 5 4v10" />
          <path strokeLinecap="round" d="M10 19v-5h4v5" />
        </svg>
      );
    case "course":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="1.5" />
          <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
          <path strokeLinecap="round" d="M8 14h3M8 17h5" />
        </svg>
      );
  }
}

function ClassesMenuList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="relative z-10 py-1">
      {classMenuSections.map((section) => {
        const items = classMenuLinks.filter((item) => item.section === section);
        if (items.length === 0) return null;

        return (
          <div key={section}>
            <p className="px-3.5 pb-0.5 pt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-header-accent/55">
              {section}
            </p>
            <ul>
              {items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 px-3.5 py-1.5 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-white/55 text-header-accent shadow-sm backdrop-blur-sm"
                          : "text-header-accent/90 hover:bg-white/35 hover:text-header-accent"
                      }`}
                    >
                      <ClassMenuIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AboutMenuList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="relative z-10 py-1.5">
      {aboutMenuLinks.map((item) => {
        const isActive =
          item.href === "/about"
            ? pathname === "/about"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-white/55 text-header-accent shadow-sm backdrop-blur-sm"
                  : "text-header-accent/90 hover:bg-white/35 hover:text-header-accent"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DropdownTrigger({
  label,
  open,
  active,
  overlayMode,
}: {
  label: string;
  open: boolean;
  active: boolean;
  overlayMode: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1.5 uppercase transition ${
        active || open
          ? overlayMode
            ? "text-pink underline decoration-pink decoration-2 underline-offset-4"
            : "text-header-accent underline decoration-header-accent decoration-2 underline-offset-4"
          : overlayMode
            ? "text-white/90 hover:text-pink"
            : "text-header-accent hover:text-header-accent-hover"
      }`}
    >
      {label}
      <span
        className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden="true"
      >
        ▾
      </span>
    </span>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [classesOpen, setClassesOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileClassesOpen, setMobileClassesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const overlayMode = isHome && !scrolled && !menuOpen;

  const isAboutActive = pathname.startsWith("/about");
  const isClassesActive = pathname.startsWith("/classes");

  const secondaryLinks = mainNavLinks.filter((link) => link.href !== "/");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setScrolled(false);
    setMenuOpen(false);
    setAboutOpen(false);
    setClassesOpen(false);
    setMobileAboutOpen(false);
    setMobileClassesOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50">
        <MemberTopBar overlayMode={overlayMode} />

        <header
          className={`transition-all duration-300 ease-out ${
            overlayMode
              ? "border-b border-transparent bg-transparent shadow-none"
              : "border-b border-header-accent/15 bg-header-bg shadow-md backdrop-blur-sm"
          }`}
        >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <Link href="/" aria-label="Wild Hearts Collective home" className="block shrink-0">
              <Image
                src={HEADER_LOGO_SRC}
                alt="Wild Hearts Collective"
                width={HEADER_LOGO_WIDTH}
                height={HEADER_LOGO_HEIGHT}
                priority
                className={`h-[72px] w-auto object-contain sm:h-[84px] lg:h-[92px] ${
                  overlayMode ? "" : "logo-header-accent"
                }`}
              />
            </Link>

            <div className="hidden gap-2 lg:flex">
              <a
                href={phoneHref}
                className={`rounded-md px-3 py-2 text-xs font-semibold normal-case tracking-normal transition ${
                  overlayMode
                    ? "border border-white/30 bg-white/15 text-white shadow hover:bg-white/25"
                    : "border border-header-accent bg-transparent text-header-accent hover:bg-header-accent/5"
                }`}
              >
                Call
              </a>
              <a
                href={`mailto:${contact.email}`}
                className={`rounded-md px-3 py-2 text-xs font-semibold normal-case tracking-normal transition ${
                  overlayMode
                    ? "border border-white/30 bg-white/15 text-white shadow hover:bg-white/25"
                    : "border border-header-accent bg-transparent text-header-accent hover:bg-header-accent/5"
                }`}
              >
                Email
              </a>
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className={`hidden items-center gap-4 text-xs font-semibold uppercase tracking-wider xl:gap-5 xl:text-sm 2xl:gap-6 lg:flex ${
              overlayMode ? "text-white" : "text-header-accent"
            }`}
          >
            <NavLink href="/" label="Home" overlayMode={overlayMode} />

            <div
              className="relative"
              onMouseEnter={() => {
                setAboutOpen(true);
                setClassesOpen(false);
              }}
              onMouseLeave={() => setAboutOpen(false)}
              onFocus={() => {
                setAboutOpen(true);
                setClassesOpen(false);
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setAboutOpen(false);
                }
              }}
            >
              <button
                type="button"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
              >
                <DropdownTrigger
                  label="About"
                  open={aboutOpen}
                  active={isAboutActive}
                  overlayMode={overlayMode}
                />
              </button>

              <div
                className={`absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  aboutOpen
                    ? "visible translate-y-0 opacity-100"
                    : "pointer-events-none invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className={dropdownPanelClass}>
                  <AboutMenuList pathname={pathname} />
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => {
                setClassesOpen(true);
                setAboutOpen(false);
              }}
              onMouseLeave={() => setClassesOpen(false)}
              onFocus={() => {
                setClassesOpen(true);
                setAboutOpen(false);
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setClassesOpen(false);
                }
              }}
            >
              <button
                type="button"
                aria-expanded={classesOpen}
                aria-haspopup="true"
              >
                <DropdownTrigger
                  label="Classes"
                  open={classesOpen}
                  active={isClassesActive}
                  overlayMode={overlayMode}
                />
              </button>

              <div
                className={`absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  classesOpen
                    ? "visible translate-y-0 opacity-100"
                    : "pointer-events-none invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className={dropdownPanelClass}>
                  <ClassesMenuList pathname={pathname} />
                </div>
              </div>
            </div>

            {secondaryLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                overlayMode={overlayMode}
              />
            ))}

            <Link
              href={BOOKING_URL}
              className={`rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition xl:text-sm ${
                overlayMode
                  ? "border border-white/30 bg-white text-brand shadow hover:bg-pink-light"
                  : "bg-sage text-white hover:bg-sage-hover"
              }`}
            >
              Book
            </Link>
          </nav>

          <button
            type="button"
            className={`rounded-md border px-3 py-2 lg:hidden ${
              overlayMode
                ? "border-white/30 bg-white/15 text-white"
                : "border-header-accent bg-transparent text-header-accent hover:bg-header-accent/5"
            }`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="max-h-[calc(100vh-7rem)] space-y-2 overflow-y-auto border-t border-header-accent/15 bg-header-bg px-4 py-4 lg:hidden">
            <MobileLink href="/" label="Home" close={() => setMenuOpen(false)} />

            <div className={dropdownPanelClass}>
              <button
                type="button"
                onClick={() => {
                  setMobileAboutOpen((open) => !open);
                  setMobileClassesOpen(false);
                }}
                className="relative z-10 flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wider text-header-accent"
              >
                <span>About</span>
                <span className="text-xs" aria-hidden="true">
                  {mobileAboutOpen ? "▲" : "▼"}
                </span>
              </button>

              {mobileAboutOpen && (
                <div className="uppercase tracking-wider">
                  <AboutMenuList
                    pathname={pathname}
                    onNavigate={() => {
                      setMenuOpen(false);
                      setMobileAboutOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            <div className={dropdownPanelClass}>
              <button
                type="button"
                onClick={() => {
                  setMobileClassesOpen((open) => !open);
                  setMobileAboutOpen(false);
                }}
                className="relative z-10 flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wider text-header-accent"
              >
                <span>Classes</span>
                <span className="text-xs" aria-hidden="true">
                  {mobileClassesOpen ? "▲" : "▼"}
                </span>
              </button>

              {mobileClassesOpen && (
                <div className="uppercase tracking-wider">
                  <ClassesMenuList
                    pathname={pathname}
                    onNavigate={() => {
                      setMenuOpen(false);
                      setMobileClassesOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            {secondaryLinks.map((link) => (
              <MobileLink
                key={link.href}
                href={link.href}
                label={link.label}
                close={() => setMenuOpen(false)}
              />
            ))}

            <Link
              href={BOOKING_URL}
              onClick={() => setMenuOpen(false)}
              className="block rounded-md bg-sage py-2.5 text-center text-sm font-bold uppercase tracking-wider text-white hover:bg-sage-hover"
            >
              Book
            </Link>

            <div className="flex gap-2 pt-1">
              <a
                href={phoneHref}
                className="flex-1 rounded-md border border-header-accent py-2 text-center text-xs font-semibold uppercase tracking-wider text-header-accent"
              >
                Call
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="flex-1 rounded-md border border-header-accent py-2 text-center text-xs font-semibold uppercase tracking-wider text-header-accent"
              >
                Email
              </a>
            </div>
          </div>
        )}
        </header>
      </div>

      {!isHome && (
        <div className="h-[128px] shrink-0 sm:h-[144px] lg:h-[152px]" aria-hidden="true" />
      )}
    </>
  );
}

function NavLink({
  href,
  label,
  overlayMode,
}: {
  href: string;
  label: string;
  overlayMode: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`transition ${
        isActive
          ? overlayMode
            ? "text-white underline decoration-pink decoration-2 underline-offset-4"
            : "text-header-accent underline decoration-header-accent decoration-2 underline-offset-4"
          : overlayMode
            ? "text-white/90 hover:text-white"
            : "text-header-accent hover:text-header-accent-hover"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  close,
}: {
  href: string;
  label: string;
  close: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={close}
      className={`block rounded-md px-3 py-2 text-sm font-medium uppercase tracking-wider transition ${
        isActive
          ? "bg-sage font-semibold text-white"
          : "text-header-accent hover:bg-header-accent/5"
      }`}
    >
      {label}
    </Link>
  );
}
