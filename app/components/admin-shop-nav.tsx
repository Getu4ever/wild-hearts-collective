import Link from "next/link";

export function AdminShopNav({
  active,
}: {
  active: "sales" | "products";
}) {
  const links = [
    { href: "/admin/shop", label: "Sales", id: "sales" as const },
    { href: "/admin/shop/products", label: "Products", id: "products" as const },
  ];

  return (
    <nav
      aria-label="Shop admin sections"
      className="mt-6 flex flex-wrap gap-2 border-t border-plum/10 pt-6"
    >
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
