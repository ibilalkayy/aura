"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function AdminHomePage() {
  const { user, loading } = useAuth();

  if (loading) return null;

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
        <p className="mt-2 text-sm text-ink-muted">This area is for admin accounts only.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl text-ink mb-1">Admin</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Manage the catalog and order fulfillment without touching code.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/products">
          <Card className="p-6 transition hover:border-brand/40">
            <p className="font-display text-lg text-ink">Products</p>
            <p className="mt-1 text-sm text-ink-muted">
              Add, edit, or remove products — name, price, stock, description.
            </p>
          </Card>
        </Link>
        <Link href="/admin/orders">
          <Card className="p-6 transition hover:border-brand/40">
            <p className="font-display text-lg text-ink">Orders</p>
            <p className="mt-1 text-sm text-ink-muted">
              Advance an order's fulfillment status.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
