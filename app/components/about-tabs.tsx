import Link from "next/link";

const tabs = [
  { href: "/about", label: "About Us" },
  { href: "/about/team", label: "Our Team" },
] as const;

export function AboutTabs({ active }: { active: "about" | "team" }) {
  return (
    <nav
      aria-label="About sections"
      className="border-b border-plum/10 bg-cream/80 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl gap-1 px-6 lg:px-8">
        {tabs.map((tab) => {
          const isActive =
            (active === "about" && tab.href === "/about") ||
            (active === "team" && tab.href === "/about/team");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] transition ${
                isActive
                  ? "text-plum"
                  : "text-muted hover:text-plum"
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-sage"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
