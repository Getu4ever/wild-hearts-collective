"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getShopProductById, type ShopProduct } from "@/lib/shop-data";

const STORAGE_KEY = "whc-shop-basket";

export type BasketLine = {
  productId: string;
  quantity: number;
};

export type BasketProductLine = BasketLine & {
  product: ShopProduct;
};

type FlyRequest = {
  id: string;
  image: string;
  name: string;
  start: { x: number; y: number; width: number; height: number };
};

type ShopCartContextValue = {
  lines: BasketLine[];
  productLines: BasketProductLine[];
  itemCount: number;
  totalPence: number;
  isOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  toggleBasket: () => void;
  addToBasket: (
    product: ShopProduct,
    options?: { imageEl?: HTMLElement | null },
  ) => void;
  removeFromBasket: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  basketButtonRef: React.RefObject<HTMLButtonElement | null>;
  flyRequests: FlyRequest[];
  completeFly: (id: string) => void;
  bumpBasket: boolean;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

function readStoredLines(): BasketLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BasketLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        typeof line.productId === "string" &&
        typeof line.quantity === "number" &&
        line.quantity > 0 &&
        Boolean(getShopProductById(line.productId)?.isAvailable),
    );
  } catch {
    return [];
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [flyRequests, setFlyRequests] = useState<FlyRequest[]>([]);
  const [bumpBasket, setBumpBasket] = useState(false);
  const basketButtonRef = useRef<HTMLButtonElement | null>(null);
  const bumpTimer = useRef<number | null>(null);

  useEffect(() => {
    setLines(readStoredLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const triggerBump = useCallback(() => {
    setBumpBasket(true);
    if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => setBumpBasket(false), 450);
  }, []);

  const addToBasket = useCallback(
    (product: ShopProduct, options?: { imageEl?: HTMLElement | null }) => {
      if (!product.isAvailable) return;

      setLines((current) => {
        const existing = current.find((line) => line.productId === product.id);
        if (existing) {
          return current.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          );
        }
        return [...current, { productId: product.id, quantity: 1 }];
      });

      const imageEl = options?.imageEl;
      const basketEl = basketButtonRef.current;
      if (imageEl && basketEl) {
        const startRect = imageEl.getBoundingClientRect();
        const flyId = `${product.id}-${Date.now()}`;
        setFlyRequests((current) => [
          ...current,
          {
            id: flyId,
            image: product.image,
            name: product.name,
            start: {
              x: startRect.left,
              y: startRect.top,
              width: startRect.width,
              height: startRect.height,
            },
          },
        ]);
      } else {
        triggerBump();
      }
    },
    [triggerBump],
  );

  const completeFly = useCallback(
    (id: string) => {
      setFlyRequests((current) => current.filter((fly) => fly.id !== id));
      triggerBump();
    },
    [triggerBump],
  );

  const removeFromBasket = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.productId !== productId);
      }
      return current.map((line) =>
        line.productId === productId ? { ...line, quantity } : line,
      );
    });
  }, []);

  const clearBasket = useCallback(() => setLines([]), []);

  const productLines = useMemo(() => {
    return lines
      .map((line) => {
        const product = getShopProductById(line.productId);
        if (!product) return null;
        return { ...line, product };
      })
      .filter((line): line is BasketProductLine => line !== null);
  }, [lines]);

  const itemCount = useMemo(
    () => productLines.reduce((sum, line) => sum + line.quantity, 0),
    [productLines],
  );

  const totalPence = useMemo(
    () =>
      productLines.reduce(
        (sum, line) => sum + line.product.pricePence * line.quantity,
        0,
      ),
    [productLines],
  );

  const value = useMemo<ShopCartContextValue>(
    () => ({
      lines,
      productLines,
      itemCount,
      totalPence,
      isOpen,
      openBasket: () => setIsOpen(true),
      closeBasket: () => setIsOpen(false),
      toggleBasket: () => setIsOpen((open) => !open),
      addToBasket,
      removeFromBasket,
      setQuantity,
      clearBasket,
      basketButtonRef,
      flyRequests,
      completeFly,
      bumpBasket,
    }),
    [
      lines,
      productLines,
      itemCount,
      totalPence,
      isOpen,
      addToBasket,
      removeFromBasket,
      setQuantity,
      clearBasket,
      flyRequests,
      completeFly,
      bumpBasket,
    ],
  );

  return (
    <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
  );
}

export function useShopCart() {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCart must be used within ShopCartProvider");
  }
  return context;
}
