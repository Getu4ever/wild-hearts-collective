import { homeStats } from "@/lib/site-data";

export function StatsSection() {
  return (
    <section className="border-y border-pink/20 bg-plum py-16 text-white">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
        {homeStats.map((stat) => (
          <div key={stat.label}>
            <div className="font-display text-5xl text-pink sm:text-6xl">
              {stat.value}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
