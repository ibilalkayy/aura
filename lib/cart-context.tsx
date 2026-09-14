"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { getProductsByIds, Product } from "./products";

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  items: { product: Product; quantity: number }[];
  subtotal: number;
  itemCount: number;
  loadingItems: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "aura-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  // Fetch (and cache) product data for any cart line whose product isn't
  // loaded yet. Products now live in Supabase, not a static file, so this
  // is a real network fetch rather than a synchronous lookup.
  useEffect(() => {
    const missingIds = lines
      .map((l) => l.productId)
      .filter((id) => !productCache[id]);
    if (missingIds.length === 0) return;

    let active = true;
    setLoadingItems(true);
    getProductsByIds(missingIds).then((fetched) => {
      if (!active) return;
      setProductCache((prev) => {
        const next = { ...prev };
        for (const p of fetched) next[p.id] = p;
        return next;
      });
      setLoadingItems(false);
    });
    return () => {
      active = false;
    };
  }, [lines, productCache]);

  const addToCart = (productId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId
            ? { ...l, quantity: l.quantity + quantity }
            : l
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
  };

  const clearCart = () => setLines([]);

  const items = useMemo(
    () =>
      lines
        .map((l) => {
          const product = productCache[l.productId];
          return product ? { product, quantity: l.quantity } : null;
        })
        .filter((x): x is { product: Product; quantity: number } => !!x),
    [lines, productCache]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        addToCart,
        removeFromCart,
        setQuantity,
        clearCart,
        items,
        subtotal,
        itemCount,
        loadingItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
