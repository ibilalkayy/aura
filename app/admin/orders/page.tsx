"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/supabase/client";
import {
  getAllOrdersForAdmin,
  adminSetOrderStatus,
  Order,
  OrderStatusKey,
  STATUS_ORDER,
  STATUS_LABELS,
} from "@/lib/orders";

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => getAllOrdersForAdmin().then(setOrders);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Sign in required</h1>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">
          Sign in
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Not authorized</h1>
        <p className="mt-2 text-sm text-ink/60">This page is for admin accounts only.</p>
      </div>
    );
  }

  const onChangeStatus = async (orderId: string, status: OrderStatusKey) => {
    setUpdatingId(orderId);
    setError(null);
    const result = await adminSetOrderStatus(orderId, status);
    if (!result.ok) setError(result.error ?? "Could not update status.");
    await load();
    setUpdatingId(null);

    // Best-effort notification email — never block the status update on it.
    getAccessToken()
      .then((token) => {
        if (!token) return;
        fetch("/api/notify/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId, status }),
        }).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-sm text-ink/50 hover:text-ink">
        ← Admin
      </Link>
      <h1 className="font-display text-2xl text-ink mb-1 mt-2">Manage orders</h1>
      <p className="mb-6 text-sm text-ink/60">
        Advance an order's status manually. There's no real courier or
        warehouse behind this — this is the deliberate "admin action instead
        of a fake integration" version.
      </p>

      {error && <p className="mb-4 text-sm text-accent">{error}</p>}

      {orders === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink/50">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{o.id}</p>
                  <p className="text-sm text-ink/60">
                    {o.name} · {new Date(o.placedAt).toLocaleString()} · $
                    {o.total.toFixed(2)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}
                  </p>
                </div>

                {o.cancelled ? (
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                    Cancelled
                  </span>
                ) : (
                  <select
                    value={o.status}
                    disabled={updatingId === o.id}
                    onChange={(e) => onChangeStatus(o.id, e.target.value as OrderStatusKey)}
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
