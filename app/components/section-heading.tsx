type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  light?: boolean;
  centered?: boolean;
};

export function SectionHeading({
  title,
  subtitle,
  light = false,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className={`mb-5 h-px w-12 ${light ? "bg-pink" : "bg-pink"}`} />
      <h2
        className={`font-display text-4xl sm:text-5xl ${
          light ? "text-white" : "text-plum"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            light ? "text-white/85" : "text-muted"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
