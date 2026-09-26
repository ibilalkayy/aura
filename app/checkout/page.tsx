"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { placeOrder } from "@/lib/orders";
import { Address, PaymentMethod, getAddresses, getPaymentMethods } from "@/lib/account-data";
import { getAccessToken } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const formatAddress = (a: Address) =>
  `${a.street}, ${a.city}, ${a.state} ${a.postalCode}, ${a.country}`;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [addressChoice, setAddressChoice] = useState("new");
  const [cardChoice, setCardChoice] = useState("new");

  useEffect(() => {
    if (!user) return;
    setName(`${user.firstName} ${user.lastName}`.trim());
    getAddresses().then((data) => {
      setSavedAddresses(data);
      if (data.length > 0) {
        setAddressChoice(data[0].id);
        setAddress(formatAddress(data[0]));
        setName(data[0].fullName);
      }
    });
    getPaymentMethods().then((data) => {
      setSavedCards(data);
      if (data.length > 0) setCardChoice(data[0].id);
    });
  }, [user]);

  const onPickAddress = (id: string) => {
    setAddressChoice(id);
    if (id === "new") {
      setAddress("");
      return;
    }
    const a = savedAddresses.find((x) => x.id === id);
    if (a) {
      setAddress(formatAddress(a));
      setName(a.fullName);
    }
  };

  const shipping = items.length > 0 ? 4.99 : 0;
  const total = subtotal + shipping;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !user) return;
    setSubmitting(true);
    setError(null);

    const result = await placeOrder({
      userId: user.id,
      name,
      address,
      items: items.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      })),
      total,
    });

    setSubmitting(false);
    if (!result.ok || !result.orderId) {
      setError(result.error ?? "Could not place order.");
      return;
    }
    clearCart();

    // Best-effort — a slow or failed email should never block checkout.
    getAccessToken()
      .then((token) => {
        if (!token) return;
        fetch("/api/notify/order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId: result.orderId }),
        }).catch(() => {});
      })
      .catch(() => {});

    router.push(`/confirmation/${result.orderId}`);
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Sign in to check out</h1>
        <p className="mt-2 text-ink-muted">
          Orders are tied to your account so you can see them from any device.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Nothing to check out</h1>
        <p className="mt-2 text-ink-muted">Your bag is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl text-ink mb-6">Checkout</h1>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                01
              </span>
              Delivery address
            </h2>

            {savedAddresses.length > 0 && (
              <select
                value={addressChoice}
                onChange={(e) => onPickAddress(e.target.value)}
                className="mb-3 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              >
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {formatAddress(a)}
                  </option>
                ))}
                <option value="new">Use a new address</option>
              </select>
            )}

            {(savedAddresses.length === 0 || addressChoice === "new") && (
              <div className="grid gap-3">
                <input
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
                <input
                  required
                  placeholder="Street address, city, postal code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            )}

            <p className="mt-2 text-xs text-ink-muted">
              Manage saved addresses in your <Link href="/account" className="underline">account</Link>.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                02
              </span>
              Payment
            </h2>

            {savedCards.length > 0 && (
              <select
                value={cardChoice}
                onChange={(e) => setCardChoice(e.target.value)}
                className="mb-3 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              >
                {savedCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cardHolder} — {c.brand} •••• {c.last4}
                  </option>
                ))}
                <option value="new">Use a new card</option>
              </select>
            )}

            {(savedCards.length === 0 || cardChoice === "new") && (
              <div className="grid gap-3">
                <input
                  required
                  placeholder="Name on card"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
                <input
                  required
                  placeholder="Card number"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  maxLength={19}
                  className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                  <input
                    required
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    maxLength={4}
                    className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-ink-muted">
              This is a demo checkout. No real payment is processed.
            </p>
          </Card>
        </div>

        <Card className="sticky top-24 space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper">
              03
            </span>
            Order summary
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal ({items.length} item{items.length > 1 ? "s" : ""})</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Placing order…" : `Place order · $${total.toFixed(2)}`}
          </Button>
        </Card>
      </form>
    </div>
  );
}
