import Link from "next/link";
import { BOOKING_URL } from "@/lib/constants";

type BookButtonProps = {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "light";
};

export function BookButton({
  className = "",
  children = "Book",
  variant = "default",
}: BookButtonProps) {
  const styles =
    variant === "light"
      ? "bg-white text-plum hover:bg-pink-light"
      : "bg-sage text-white hover:bg-sage-hover";

  return (
    <Link
      href={BOOKING_URL}
      className={`inline-flex items-center justify-center rounded-sm px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
