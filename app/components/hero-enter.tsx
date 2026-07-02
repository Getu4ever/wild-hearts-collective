"use client";

import { usePathname } from "next/navigation";

type HeroEnterProps = {
  children: React.ReactNode;
  className?: string;
};

export function HeroEnter({ children, className = "" }: HeroEnterProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={`animate-page-enter ${className}`.trim()}>
      {children}
    </div>
  );
}
