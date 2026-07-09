import Image from "next/image";
import Link from "next/link";
import { BOOKING_URL } from "@/lib/constants";
import {
  contact,
  footerDescription,
  footerLegalLinks,
  footerQuickLinks,
  footerServiceLinks,
  siteConfig,
  socialLinks,
} from "@/lib/site-data";
import { HEADER_LOGO_SRC } from "./logo";
import { FooterMemberLinks } from "./member-top-bar";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white">
      <span className="inline-block h-4 w-0.5 shrink-0 rounded-full bg-header-bg" aria-hidden="true" />
      {children}
    </h3>
  );
}

function FooterLinkList({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <ul className="mt-4 space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="group inline-flex text-[13px] leading-snug text-white/75 transition hover:text-header-bg"
          >
            <span className="mr-1.5 text-header-bg/0 transition group-hover:text-header-bg">›</span>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function ContactBlock() {
  return (
    <div>
      <h3 className="font-display text-2xl text-white">Contact us</h3>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-white/85">
        <li>
          <span className="font-bold text-white">Address</span>
          <br />
          {contact.addressLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </li>
        <li>
          <span className="font-bold text-white">Phone</span>
          <br />
          {contact.phone}
        </li>
        <li>
          <span className="font-bold text-white">Email</span>
          <br />
          <a
            href={`mailto:${contact.email}`}
            className="underline-offset-2 hover:text-header-bg hover:underline"
          >
            {contact.email}
          </a>
        </li>
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const phoneHref = contact.phone.startsWith("Phone")
    ? "/contact"
    : `tel:${contact.phone.replace(/\s/g, "")}`;

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-plum via-[#4a2540] to-brand text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <Image
          src="/team/rosie.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[70%_20%] opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-plum/92 via-[#4a2540]/88 to-brand/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/80 via-transparent to-plum/40" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-header-bg"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6 xl:gap-8">
          <div className="lg:pr-2">
            <Link href="/" aria-label={`${siteConfig.name} home`} className="inline-block">
              <Image
                src={HEADER_LOGO_SRC}
                alt={siteConfig.name}
                width={646}
                height={493}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">
              {footerDescription}
            </p>
            <FooterMemberLinks />
          </div>

          <div className="border-t border-white/10 pt-8 sm:border-t-0 sm:pt-0 lg:border-l lg:border-white/10 lg:pl-6">
            <FooterHeading>Services</FooterHeading>
            <FooterLinkList links={footerServiceLinks} />
          </div>

          <div className="border-t border-white/10 pt-8 sm:border-t-0 sm:pt-0 lg:border-l lg:border-white/10 lg:pl-6">
            <FooterHeading>Quick Links</FooterHeading>
            <FooterLinkList links={footerQuickLinks} />
          </div>

          <div className="border-t border-white/10 pt-8 sm:border-t-0 sm:pt-0 lg:border-l lg:border-white/10 lg:pl-6">
            <FooterHeading>Legal</FooterHeading>
            <FooterLinkList links={footerLegalLinks} />
          </div>

          <div className="border-t border-white/10 pt-8 sm:border-t-0 sm:pt-0 lg:border-l lg:border-white/10 lg:pl-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white">
              Let&apos;s Connect
            </h3>
            <dl className="mt-4 space-y-4 text-[13px] text-white/75">
              <div>
                <dt className="font-bold text-white">Address</dt>
                <dd className="mt-1 leading-relaxed">
                  {contact.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-white">Phone</dt>
                <dd className="mt-1">
                  <a href={phoneHref} className="transition hover:text-header-bg">
                    {contact.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-white">Email</dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all transition hover:text-header-bg"
                  >
                    {contact.email}
                  </a>
                </dd>
              </div>
            </dl>
            <Link
              href={BOOKING_URL}
              className="mt-4 inline-flex rounded-full bg-header-bg px-4 py-2 text-xs font-bold uppercase tracking-wide text-plum shadow-lg shadow-black/10 transition hover:opacity-90"
            >
              Book a Class
            </Link>
            <div className="mt-4 flex gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-header-bg hover:bg-header-bg hover:text-plum"
                >
                  <SocialIcon label={link.label} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/20 px-6 py-5 text-[11px] tracking-wide text-white/50 backdrop-blur-[1px] lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-2 sm:grid-cols-3">
          <p className="text-left">
            Website by –{" "}
            <a
              href="https://www.karoldigital.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-header-bg hover:underline"
            >
              Karol Digital
            </a>
          </p>
          <p className="text-center">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <div aria-hidden="true" className="hidden sm:block" />
        </div>
      </div>
    </footer>
  );
}
