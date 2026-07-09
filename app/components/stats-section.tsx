import { homeStats } from "@/lib/site-data";

export function StatsSection() {
  return (
    <section className="border-y border-header-accent/15 bg-header-bg py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
        {homeStats.map((stat) => (
          <div key={stat.label}>
            <div className="font-display text-5xl text-brand sm:text-6xl">
              {stat.value}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
