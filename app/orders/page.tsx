"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getOrders, Order, OrderStatusKey, STATUS_LABELS } from "@/lib/orders";
import { useAuth } from "@/lib/auth-context";
import { getProductsByIds, Product } from "@/lib/products";

type StatusFilter = "all" | OrderStatusKey | "cancelled";

function statusKeyOf(o: Order): OrderStatusKey | "cancelled" {
  return o.cancelled ? "cancelled" : o.status;
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [productImages, setProductImages] = useState<Record<string, Product>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = async () => {
    const data = await getOrders();
    setOrders(data);
    const allProductIds = data.flatMap((o) => o.items.map((i) => i.productId));
    const products = await getProductsByIds(allProductIds);
    setProductImages(Object.fromEntries(products.map((p) => [p.id, p])));
  };

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    load();
    // Poll every 30s so a status change an admin makes elsewhere shows up
    // here without a manual reload.
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading || orders === null) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Sign in to see your orders</h1>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">No orders yet</h1>
        <Link href="/search" className="mt-4 inline-block text-brand hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    const matchesQuery =
      !needle ||
      o.id.toLowerCase().includes(needle) ||
      o.items.some((i) => i.name.toLowerCase().includes(needle));
    const matchesStatus = statusFilter === "all" || statusKeyOf(o) === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "placed", label: "Placed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl text-ink mb-4">Your orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              statusFilter === f.key
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink/70 hover:border-brand"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length > 3 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders by order ID or product name"
          className="mb-6 w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-ink/50">No orders match this filter.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const statusLabel = o.cancelled ? "Cancelled" : STATUS_LABELS[o.status];
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="block rounded-2xl border border-line bg-white p-5 transition hover:border-brand/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{o.id}</span>
                  <span className="text-ink/50">
                    {new Date(o.placedAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      o.cancelled
                        ? "bg-accent/10 text-accent"
                        : "bg-brand/10 text-brand"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <span className="font-semibold text-ink">${o.total.toFixed(2)}</span>
                </div>

                <div className="mt-3 space-y-2">
                  {o.items.map((i) => {
                    const product = productImages[i.productId];
                    return (
                      <div key={i.productId} className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                          {product && (
                            <Image src={product.image} alt={i.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="truncate text-ink/80">{i.name}</p>
                          <p className="text-ink/50">
                            Qty {i.quantity} · ${i.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
