"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Your bag is empty</h1>
        <p className="mt-2 text-ink-muted">Nothing here yet.</p>
        <Link href="/search" className="mt-6 inline-block">
          <Button>Start browsing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl text-ink mb-6">Your bag</h1>

      <Card className="divide-y divide-line">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-4 p-4">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
              <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-4">
                <Link href={`/product/${product.slug}`} className="text-sm font-medium text-ink hover:underline">
                  {product.name}
                </Link>
                <span className="whitespace-nowrap text-sm font-semibold text-ink">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                  className="rounded-lg border border-line bg-surface px-2 py-1"
                >
                  {Array.from({ length: Math.max(quantity, Math.min(product.stock, 5)) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} disabled={n > product.stock}>
                      Qty {n}
                    </option>
                  ))}
                </select>
                {product.stock < quantity && (
                  <span className="text-danger">Only {product.stock} left — reduce quantity</span>
                )}
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="text-ink-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="mt-6 flex items-center justify-between p-5">
        <span className="text-ink-muted">Subtotal</span>
        <span className="text-xl font-semibold text-ink">${subtotal.toFixed(2)}</span>
      </Card>

      <Link href="/checkout" className="mt-4 block">
        <Button size="lg" className="w-full">
          Checkout
        </Button>
      </Link>
    </div>
  );
}
