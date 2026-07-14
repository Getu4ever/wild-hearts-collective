"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { useShopCart } from "@/app/components/shop-cart-context";

/** Ghost product image that arcs into the floating basket. */
export function ShopFlyToBasket() {
  const { flyRequests, basketButtonRef, completeFly } = useShopCart();

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
      {flyRequests.map((fly) => (
        <FlyingItem
          key={fly.id}
          fly={fly}
          basketEl={basketButtonRef.current}
          onDone={() => completeFly(fly.id)}
        />
      ))}
    </div>
  );
}

type FlyingItemProps = {
  fly: {
    id: string;
    image: string;
    name: string;
    start: { x: number; y: number; width: number; height: number };
  };
  basketEl: HTMLButtonElement | null;
  onDone: () => void;
};

function FlyingItem({ fly, basketEl, onDone }: FlyingItemProps) {
  const [style, setStyle] = useState<CSSProperties>({
    left: fly.start.x,
    top: fly.start.y,
    width: fly.start.width,
    height: fly.start.height,
    opacity: 1,
    transform: "translate(0, 0) scale(1)",
  });

  useEffect(() => {
    const basketRect = basketEl?.getBoundingClientRect();
    const endX = basketRect
      ? basketRect.left + basketRect.width / 2 - 28
      : window.innerWidth - 72;
    const endY = basketRect
      ? basketRect.top + basketRect.height / 2 - 28
      : window.innerHeight - 72;

    const deltaX = endX - fly.start.x;
    const deltaY = endY - fly.start.y;

    const frame = window.requestAnimationFrame(() => {
      setStyle({
        left: fly.start.x,
        top: fly.start.y,
        width: fly.start.width,
        height: fly.start.height,
        opacity: 0.35,
        transform: `translate(${deltaX}px, ${deltaY}px) scale(0.18)`,
        transition:
          "transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.75s ease",
      });
    });

    const done = window.setTimeout(onDone, 780);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
  }, [basketEl, fly.start, onDone]);

  return (
    <div className="fixed overflow-hidden rounded-sm shadow-lg" style={style}>
      <Image
        src={fly.image}
        alt=""
        width={160}
        height={120}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
