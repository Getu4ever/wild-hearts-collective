import Link from "next/link";

type ContentSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function ContentSection({
  children,
  className = "",
  id,
}: ContentSectionProps) {
  return (
    <section id={id} className={`py-20 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-6 lg:px-8">{children}</div>
    </section>
  );
}

type ProseBlockProps = {
  children: React.ReactNode;
};

export function ProseBlock({ children }: ProseBlockProps) {
  return (
    <div className="max-w-3xl space-y-5 text-base leading-relaxed text-foreground [&_p_a]:font-medium [&_p_a]:text-plum [&_p_a]:underline-offset-2 hover:[&_p_a]:text-pink hover:[&_p_a]:underline">
      {children}
    </div>
  );
}

export function ReadMoreLink({
  href,
  label = "Read more",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mt-6 inline-flex text-sm font-semibold uppercase tracking-wider text-plum transition-colors hover:text-pink"
    >
      {label} →
    </Link>
  );
}
