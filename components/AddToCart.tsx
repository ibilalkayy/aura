"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import Button from "@/components/ui/Button";

export default function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock === 0) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className="cursor-not-allowed rounded-full bg-line px-6 py-3 text-sm font-medium text-ink-muted"
        >
          Out of stock
        </button>
        <p className="text-sm text-ink-muted">Check back later — this item is currently sold out.</p>
      </div>
    );
  }

  const maxQty = Math.min(stock, 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-ink-muted" htmlFor="qty">
          Quantity
        </label>
        <select
          id="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
        >
          {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {stock <= 5 && (
          <span className="text-sm text-amber-strong">Only {stock} left</span>
        )}
      </div>

      <Button
        onClick={() => {
          addToCart(productId, qty);
          setAdded(true);
        }}
        size="lg"
      >
        Add to bag
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => {
          addToCart(productId, qty);
          router.push("/checkout");
        }}
      >
        Buy now
      </Button>

      {added && (
        <p className="text-sm text-brand">
          Added to bag. <a href="/cart" className="underline">View bag</a>
        </p>
      )}
    </div>
  );
}
