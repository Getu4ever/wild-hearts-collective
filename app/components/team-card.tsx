import Image from "next/image";
import Link from "next/link";

type TeamCardProps = {
  name: string;
  role: string;
  bio: string;
  href: string;
  imageSrc: string;
  imagePosition?: string;
};

export function TeamCard({
  name,
  role,
  bio,
  href,
  imageSrc,
  imagePosition = "object-top",
}: TeamCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-plum/8 transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={imageSrc}
            alt={`${name} at Wild Hearts Collective`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${imagePosition}`}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-plum/50 via-plum/10 to-transparent"
          />
        </div>
        <div className="border-t border-plum/8 px-5 py-5">
          <h3 className="font-display text-2xl text-plum">{name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-pink">
            {role}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{bio}</p>
        </div>
      </Link>
      <div className="mt-auto px-5 pb-5">
        <Link
          href={href}
          className="inline-flex text-sm font-semibold uppercase tracking-wider text-plum transition-colors hover:text-pink"
        >
          Click to learn more →
        </Link>
      </div>
    </article>
  );
}
