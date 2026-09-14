"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

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
          className="cursor-not-allowed rounded-full bg-line px-6 py-3 text-sm font-medium text-ink/40"
        >
          Out of stock
        </button>
        <p className="text-sm text-ink/50">Check back later — this item is currently sold out.</p>
      </div>
    );
  }

  const maxQty = Math.min(stock, 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-ink/60" htmlFor="qty">
          Quantity
        </label>
        <select
          id="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm"
        >
          {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {stock <= 5 && (
          <span className="text-sm text-accent">Only {stock} left</span>
        )}
      </div>

      <button
        onClick={() => {
          addToCart(productId, qty);
          setAdded(true);
        }}
        className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Add to cart
      </button>
      <button
        onClick={() => {
          addToCart(productId, qty);
          router.push("/checkout");
        }}
        className="rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink hover:bg-ink hover:text-white"
      >
        Buy now
      </button>

      {added && (
        <p className="text-sm text-brand">
          Added to cart. <a href="/cart" className="underline">View cart</a>
        </p>
      )}
    </div>
  );
}
