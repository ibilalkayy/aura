"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrder, cancelOrder, canCancelOrder, getOrderStatusHistory, buildStatusSteps, Order, StatusHistoryEntry } from "@/lib/orders";
import { getProductsByIds, Product } from "@/lib/products";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [productImages, setProductImages] = useState<Record<string, Product>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async (orderId: string) => {
    const o = await getOrder(orderId);
    setOrder(o);
    if (o) {
      const [products, h] = await Promise.all([
        getProductsByIds(o.items.map((i) => i.productId)),
        getOrderStatusHistory(orderId),
      ]);
      setProductImages(Object.fromEntries(products.map((p) => [p.id, p])));
      setHistory(h);
    }
  };

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      load(id);
    });
  }, [params]);

  // Poll every 30s so a status change an admin makes elsewhere shows up
  // here without a manual reload.
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => load(id), 30_000);
    return () => clearInterval(interval);
  }, [id]);

  if (order === undefined) return null;

  if (order === null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Order not found</h1>
        <Link href="/orders" className="mt-4 inline-block text-brand hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const onConfirmCancel = async () => {
    if (!id) return;
    setCancelling(true);
    await cancelOrder(id);
    await load(id);
    setCancelling(false);
    setConfirmCancel(false);
  };

  const { steps, currentIndex } = buildStatusSteps(order, history);
  const cancellable = canCancelOrder(order);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/orders" className="text-sm text-ink/50 hover:text-ink">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-ink">{order.id}</h1>
        <span className="text-sm text-ink/50">
          Placed {new Date(order.placedAt).toLocaleString()}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        {order.cancelled ? (
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              ✕
            </div>
            <p className="font-medium text-ink">Order cancelled</p>
            <p className="mt-1 text-sm text-ink/50">
              Cancelled {order.cancelledAt && new Date(order.cancelledAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="flex items-start">
            {steps.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-start last:flex-none">
                <div className="flex w-20 flex-col items-center">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      i <= currentIndex ? "bg-brand text-white" : "bg-line text-ink/40"
                    }`}
                  >
                    {i <= currentIndex ? "✓" : ""}
                  </div>
                  <p className="mt-2 text-center text-xs text-ink/70">{s.label}</p>
                  <p className="mt-0.5 text-center text-[10px] text-ink/40">
                    {s.date ? s.date.toLocaleDateString() : "Pending"}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mt-3 h-0.5 flex-1 ${i < currentIndex ? "bg-brand" : "bg-line"}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-3 text-sm font-medium text-ink">Items</h2>
        <div className="space-y-3">
          {order.items.map((i) => {
            const product = productImages[i.productId];
            return (
              <div key={i.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {product && <Image src={product.image} alt={i.name} fill className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink/80">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0 text-ink/70">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm">
        <h2 className="mb-1 font-medium text-ink">Shipping to</h2>
        <p className="text-ink/60">{order.name}</p>
        <p className="text-ink/60">{order.address}</p>
      </div>

      {!order.cancelled && (
        <div className="mt-6">
          {cancellable ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full rounded-full border border-accent px-6 py-3 text-sm font-medium text-accent hover:bg-accent hover:text-white"
            >
              Cancel order
            </button>
          ) : order.status === "shipped" || order.status === "delivered" ? (
            <p className="text-center text-sm text-ink/40">
              This order has already {order.status === "delivered" ? "been delivered" : "shipped"} and can no longer be cancelled.
            </p>
          ) : (
            <p className="text-center text-sm text-ink/40">
              This order can no longer be cancelled — the 24-hour cancellation window has passed.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="This will cancel your order. This can't be undone."
        confirmLabel={cancelling ? "Cancelling…" : "Cancel order"}
        cancelLabel="Keep order"
        danger
        onConfirm={onConfirmCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
