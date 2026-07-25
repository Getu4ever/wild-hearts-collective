"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MemberLogoutButton } from "@/app/components/member-logout-button";
import type { PublicMember } from "@/lib/member-auth";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/profile", label: "Profile", exact: false },
  { href: "/account/bookings", label: "Bookings", exact: false },
  { href: "/account/parq", label: "PAR-Q", exact: false },
  { href: "/account/credits", label: "Credits", exact: false },
];

export function MemberNav({ member }: { member: PublicMember }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-plum/10 bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Member account
          </p>
          <h1 className="font-display text-3xl text-plum">Hi, {member.name.split(" ")[0]}</h1>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <nav aria-label="Account navigation" className="flex flex-wrap gap-2">
            {links.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-sm px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-sage text-white"
                      : "border border-plum/15 bg-white text-plum hover:border-pink hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <MemberLogoutButton />
        </div>
      </div>
    </div>
  );
}
