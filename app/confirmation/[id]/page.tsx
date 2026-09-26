"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrder, Order } from "@/lib/orders";
import { getProductsByIds, Product } from "@/lib/products";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [productImages, setProductImages] = useState<Record<string, Product>>({});

  useEffect(() => {
    params.then(async ({ id }) => {
      const o = await getOrder(id);
      setOrder(o);
      if (o) {
        const products = await getProductsByIds(o.items.map((i) => i.productId));
        setProductImages(Object.fromEntries(products.map((p) => [p.id, p])));
      }
    });
  }, [params]);

  if (order === undefined) return null;

  if (order === null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Order not found</h1>
        <Link href="/" className="mt-4 inline-block text-brand hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-2xl text-sage-strong">
        ✓
      </div>
      <h1 className="font-display text-2xl text-ink">Order placed</h1>
      <p className="mt-2 text-ink-muted">
        Order <span className="font-medium text-ink">{order.id}</span> confirmed.
        Shipping to {order.name}.
      </p>

      <Card className="mt-8 p-5 text-left">
        <h2 className="mb-3 text-sm font-medium text-ink">Items</h2>
        <div className="space-y-3 text-sm">
          {order.items.map((i) => {
            const product = productImages[i.productId];
            return (
              <div key={i.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {product && (
                    <Image src={product.image} alt={i.name} fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-ink-muted">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0 text-ink-muted">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </Card>

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/orders">
          <Button variant="secondary">View orders</Button>
        </Link>
        <Link href="/search">
          <Button>Keep shopping</Button>
        </Link>
      </div>
    </div>
  );
}
