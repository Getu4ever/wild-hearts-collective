import Link from "next/link";
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  canAccessAdminSection,
} from "@/lib/admin-permissions";

const links: {
  href: string;
  label: string;
  id:
    | "dashboard"
    | "schedule"
    | "bookings"
    | "members"
    | "tutors"
    | "shop"
    | "pricing"
    | "timetable"
    | "analytics"
    | "staff";
  permission: AdminPermission;
}[] = [
  {
    href: "/admin",
    label: "Dashboard",
    id: "dashboard",
    permission: ADMIN_PERMISSIONS.dashboard,
  },
  {
    href: "/admin/schedule",
    label: "Schedule",
    id: "schedule",
    permission: ADMIN_PERMISSIONS.schedule,
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    id: "bookings",
    permission: ADMIN_PERMISSIONS.bookings,
  },
  {
    href: "/admin/members",
    label: "Members",
    id: "members",
    permission: ADMIN_PERMISSIONS.members,
  },
  {
    href: "/admin/tutors",
    label: "Instructors",
    id: "tutors",
    permission: ADMIN_PERMISSIONS.tutors,
  },
  {
    href: "/admin/shop",
    label: "Shop",
    id: "shop",
    permission: ADMIN_PERMISSIONS.shop,
  },
  {
    href: "/admin/pricing",
    label: "Passes & pricing",
    id: "pricing",
    permission: ADMIN_PERMISSIONS.pricing,
  },
  {
    href: "/admin/timetable",
    label: "Timetable",
    id: "timetable",
    permission: ADMIN_PERMISSIONS.timetable,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    id: "analytics",
    permission: ADMIN_PERMISSIONS.analytics,
  },
  {
    href: "/admin/staff",
    label: "Staff",
    id: "staff",
    permission: ADMIN_PERMISSIONS.staff,
  },
];

export function AdminNav({
  active,
  permissions,
}: {
  active: (typeof links)[number]["id"];
  permissions: readonly AdminPermission[];
}) {
  const visible = links.filter((link) =>
    canAccessAdminSection(permissions, link.permission),
  );

  return (
    <nav aria-label="Admin sections" className="mt-6 flex flex-wrap gap-2">
      {visible.map((link) => {
        const isActive = active === link.id;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              isActive
                ? "bg-sage text-white shadow-sm"
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
