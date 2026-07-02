import { whyChooseUs } from "@/lib/site-data";

const accentColors = [
  "from-pink/30 to-pink-light/20",
  "from-brand/25 to-pink/15",
  "from-plum/10 to-pink-soft",
  "from-pink-light/40 to-background",
  "from-brand/20 to-pink-light/25",
  "from-pink/20 to-brand/10",
];

export function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-background py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-pink/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 h-px w-12 bg-pink" />
          <h2 className="font-display text-4xl text-plum sm:text-5xl">
            {whyChooseUs.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {whyChooseUs.intro}
          </p>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.reasons.map((reason, index) => (
            <li
              key={reason.title}
              className="group relative overflow-hidden rounded-sm border border-plum/8 bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-pink/30 hover:shadow-md"
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${accentColors[index % accentColors.length]}`}
              />
              <div className="relative">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-2xl text-plum">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {reason.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
