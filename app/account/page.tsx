"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Address,
  PaymentMethod,
  getAddresses,
  addAddress,
  deleteAddress,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  detectBrand,
  uploadAvatar,
} from "@/lib/account-data";
import ConfirmDialog from "@/components/ConfirmDialog";
import CountryInput from "@/components/CountryInput";
import PhoneInput from "@/components/PhoneInput";

type Tab = "details" | "addresses" | "payment";

export default function AccountPage() {
  const { user, loading, deleteAccount } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("details");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">You're not signed in</h1>
        <p className="mt-2 text-ink/60">Sign in to view your account.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Personal details" },
    { key: "addresses", label: "Addresses" },
    { key: "payment", label: "Payment methods" },
  ];

  const onDeleteAccount = async () => {
    const result = await deleteAccount();
    if (result.ok) {
      router.push("/");
    } else {
      setDeleteError(result.error ?? "Could not delete account.");
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-xl text-brand">
            {(user.firstName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-sm text-ink/60">{user.email}</p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === t.key
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink/70 hover:border-brand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" && <DetailsPanel />}
      {tab === "addresses" && <AddressesPanel userId={user.id} />}
      {tab === "payment" && <PaymentPanel userId={user.id} />}

      <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <h2 className="text-sm font-medium text-ink">Danger zone</h2>
        <p className="mt-1 text-sm text-ink/60">
          Deleting your account removes your profile, saved addresses, payment
          methods, and orders. This can't be undone.
        </p>
        {deleteError && <p className="mt-2 text-sm text-accent">{deleteError}</p>}
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Delete account
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently removes your profile, saved addresses, payment methods, and orders. This can't be undone."
        confirmLabel="Delete account"
        danger
        onConfirm={onDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function DetailsPanel() {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    const result = await uploadAvatar(user.id, file);
    setUploading(false);
    if (result.url) {
      setAvatar(result.url);
    } else {
      setError(result.error ?? "Could not upload photo.");
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await updateUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      avatar,
    });
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error ?? "Could not save changes.");
    }
  };

  return (
    <form onSubmit={onSave} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-4">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 font-display text-xl text-brand">
            {(firstName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <label className="inline-block cursor-pointer rounded-full border border-line px-4 py-2 text-xs text-ink/70 hover:border-brand">
            {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-ink/50">First name</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink/50">Last name</label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink/50">Email</label>
        <input
          disabled
          value={user?.email ?? ""}
          className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink/50"
        />
        <p className="mt-1 text-xs text-ink/40">Email changes go through Supabase Auth and aren't editable here yet.</p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink/50">Phone (optional)</label>
        <PhoneInput value={phone} onChange={setPhone} />
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Save changes
      </button>
      {saved && <p className="text-center text-sm text-brand">Saved.</p>}
    </form>
  );
}

function AddressesPanel({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>({
    label: "Home",
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const refresh = () => getAddresses().then(setAddresses);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await addAddress(userId, form);
    if (!result.ok) {
      setError(result.error ?? "Could not save address.");
      return;
    }
    await refresh();
    setForm({ label: "Home", fullName: "", street: "", city: "", state: "", postalCode: "", country: "", phone: "" });
    setShowForm(false);
  };

  const onDelete = async (id: string) => {
    await deleteAddress(id);
    await refresh();
  };

  return (
    <div className="space-y-4">
      {addresses.map((a) => (
        <div key={a.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink">{a.label}</span>
            <button onClick={() => onDelete(a.id)} className="text-ink/40 hover:text-accent">
              Remove
            </button>
          </div>
          <p className="mt-1 text-ink/60">
            {a.fullName}, {a.street}, {a.city}, {a.state} {a.postalCode}, {a.country}
          </p>
        </div>
      ))}

      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-ink/50">No saved addresses yet.</p>
      )}

      {showForm ? (
        <form onSubmit={onAdd} className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Label (Home, Work…)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
            <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          <input required placeholder="Street address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <div className="grid grid-cols-3 gap-3">
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
            <input placeholder="State/Province" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
            <input required placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CountryInput required value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">
              Save address
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-line px-6 py-3 text-sm text-ink/70 hover:border-brand">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-full border border-dashed border-line px-6 py-3 text-sm text-ink/60 hover:border-brand hover:text-brand"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}

function PaymentPanel({ userId }: { userId: string }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const refresh = () => getPaymentMethods().then(setMethods);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = cardNumber.replace(/\s/g, "");
    const result = await addPaymentMethod(userId, {
      cardHolder,
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      expiry,
    });
    if (!result.ok) {
      setError(result.error ?? "Could not save card.");
      return;
    }
    await refresh();
    setCardHolder("");
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setShowForm(false);
  };

  const onDelete = async (id: string) => {
    await deletePaymentMethod(id);
    await refresh();
  };

  return (
    <div className="space-y-4">
      {methods.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 text-sm">
          <div>
            <p className="font-medium text-ink">{m.cardHolder}</p>
            <p className="text-ink/60">{m.brand} •••• {m.last4} — exp {m.expiry}</p>
          </div>
          <button onClick={() => onDelete(m.id)} className="text-ink/40 hover:text-accent">
            Remove
          </button>
        </div>
      ))}

      {methods.length === 0 && !showForm && (
        <p className="text-sm text-ink/50">No saved payment methods yet.</p>
      )}

      {showForm ? (
        <form onSubmit={onAdd} className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <input required placeholder="Name on card" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <input required placeholder="Card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
            <input required placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} className="rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          <p className="text-xs text-ink/40">
            Only the name, card brand, last 4 digits, and expiry are saved. The full card number and CVC are never sent anywhere but this form.
          </p>
          {error && <p className="text-sm text-accent">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">
              Save card
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-line px-6 py-3 text-sm text-ink/70 hover:border-brand">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-full border border-dashed border-line px-6 py-3 text-sm text-ink/60 hover:border-brand hover:text-brand"
        >
          + Add a payment method
        </button>
      )}
    </div>
  );
}
