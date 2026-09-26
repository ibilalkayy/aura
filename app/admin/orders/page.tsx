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
import Button from "@/components/ui/Button";

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
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Not authorized</h1>
        <p className="mt-2 text-sm text-ink-muted">This page is for admin accounts only.</p>
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/admin" className="text-sm text-ink-muted hover:text-ink">
        ← Admin
      </Link>
      <h1 className="font-display text-2xl text-ink mb-1 mt-2">Manage orders</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Advance an order's status manually. There's no real courier or
        warehouse behind this — this is the deliberate "admin action instead
        of a fake integration" version.
      </p>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {orders === null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink-muted">No orders yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Customer</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Placed</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-ink">{o.id}</td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{o.name}</td>
                  <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                    {new Date(o.placedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    ${o.total.toFixed(2)}{" "}
                    <span className="text-xs text-ink-muted">
                      ({o.items.length} item{o.items.length > 1 ? "s" : ""})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.cancelled ? (
                      <span className="rounded-full bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger">
                        Cancelled
                      </span>
                    ) : (
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => onChangeStatus(o.id, e.target.value as OrderStatusKey)}
                        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
