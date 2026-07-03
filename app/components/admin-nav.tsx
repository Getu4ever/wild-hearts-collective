import Link from "next/link";

export function AdminNav({
  active,
}: {
  active: "dashboard" | "bookings" | "members";
}) {
  const links = [
    { href: "/admin", label: "Dashboard", id: "dashboard" as const },
    { href: "/admin/bookings", label: "Bookings", id: "bookings" as const },
    { href: "/admin/members", label: "Members", id: "members" as const },
  ];

  return (
    <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = active === link.id;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              isActive
                ? "bg-plum text-white shadow-sm"
                : "border border-plum/15 bg-white text-plum hover:border-pink hover:text-brand"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
