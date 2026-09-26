"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrder, cancelOrder, canCancelOrder, getOrderStatusHistory, buildStatusSteps, Order, StatusHistoryEntry } from "@/lib/orders";
import { getProductsByIds, Product } from "@/lib/products";
import ConfirmDialog from "@/components/ConfirmDialog";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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
      <Link href="/orders" className="text-sm text-ink-muted hover:text-ink">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-ink">{order.id}</h1>
        <span className="text-sm text-ink-muted">
          Placed {new Date(order.placedAt).toLocaleString()}
        </span>
      </div>

      <Card className="mt-6 p-6">
        {order.cancelled ? (
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              ✕
            </div>
            <p className="font-medium text-ink">Order cancelled</p>
            <p className="mt-1 text-sm text-ink-muted">
              Cancelled {order.cancelledAt && new Date(order.cancelledAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <ol className="space-y-0">
            {steps.map((s, i) => {
              const reached = i <= currentIndex;
              const isLast = i === steps.length - 1;
              return (
                <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && (
                    <span
                      className={cn(
                        "absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5",
                        i < currentIndex ? "bg-brand" : "bg-line"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                      reached ? "bg-brand text-white" : "border border-line bg-surface"
                    )}
                  >
                    {reached ? "✓" : ""}
                  </span>
                  <div className="pt-0.5">
                    <p className={cn("text-sm font-medium", reached ? "text-ink" : "text-ink-muted")}>
                      {s.label}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {s.date ? s.date.toLocaleString() : "Pending"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-ink">Items</h2>
        <div className="space-y-3">
          {order.items.map((i) => {
            const product = productImages[i.productId];
            return (
              <div key={i.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {product && <Image src={product.image} alt={i.name} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0 text-ink-muted">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </Card>

      <Card className="mt-6 p-5 text-sm">
        <h2 className="mb-1 font-medium text-ink">Shipping to</h2>
        <p className="text-ink-muted">{order.name}</p>
        <p className="text-ink-muted">{order.address}</p>
      </Card>

      {!order.cancelled && (
        <div className="mt-6">
          {cancellable ? (
            <Button variant="danger" className="w-full" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          ) : order.status === "shipped" || order.status === "delivered" ? (
            <p className="text-center text-sm text-ink-muted">
              This order has already {order.status === "delivered" ? "been delivered" : "shipped"} and can no longer be cancelled.
            </p>
          ) : (
            <p className="text-center text-sm text-ink-muted">
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
