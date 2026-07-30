"use client";

export function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** Compact avatar for admin lists, roster, and member detail headers. */
export function AdminMemberAvatar({
  name,
  image,
  sizeClass = "h-9 w-9",
  initialsClassName = "text-xs",
}: {
  name: string;
  image: string | null | undefined;
  sizeClass?: string;
  initialsClassName?: string;
}) {
  const initials = memberInitials(name);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-plum/10 bg-pink-soft ${sizeClass}`}
      title={name}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs and Google avatars
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold text-brand ${initialsClassName}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
