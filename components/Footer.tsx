"use client";

import { useState } from "react";
import Link from "next/link";
import InfoDialog from "@/components/InfoDialog";
import ThemeToggle from "@/components/ui/ThemeToggle";

type Popup = { label: string; message: string };

const infoLinks: { label: string; message: string }[] = [
  {
    label: "About us",
    message:
      "Aura is a small online store for electronics, home goods, fashion, and a few other everyday categories. It was built around one idea: shopping online shouldn't mean wading through sponsored listings and upsells just to buy something straightforward.",
  },
  {
    label: "Careers",
    message:
      "We're not actively hiring right now. This store is a small, independently built project rather than a company with an open roles page — but that may change as it grows.",
  },
  {
    label: "Press",
    message:
      "For press or media questions, the best starting point is the Contact us link below. There's no press kit yet, since this is an early-stage build.",
  },
  {
    label: "Contact us",
    message:
      "Most order questions — status, delivery estimates, cancellation — are answered right on your order's details page under Orders. There's no live chat or phone support here; this is a small, independently run store.",
  },
  {
    label: "Shipping & returns",
    message:
      "Orders ship from Pakistan. Each product page shows a delivery estimate based on the destination country. Orders can be cancelled free of charge within 24 hours of being placed, from the order's details page — after that, the order is considered final.",
  },
  {
    label: "FAQ",
    message:
      "Do I need an account to browse? No — only to check out. Is my card information stored? Only the card brand, last 4 digits, and expiry are ever saved — never the full number or the CVC. Can I cancel an order? Yes, within 24 hours of placing it.",
  },
  {
    label: "Privacy policy",
    message:
      "Account details, addresses, and order history are stored in a real database and are only ever accessible to your own account and this store's admin. Nothing is sold or shared with advertisers or other third parties.",
  },
  {
    label: "Terms of service",
    message:
      "By placing an order, you're agreeing to the shipping and cancellation terms described under Shipping & returns. Prices and availability can change without notice, and stock is not guaranteed until an order is confirmed.",
  },
];

const socials: { label: string; icon: string; href: string }[] = [
  { label: "X (Twitter)", icon: "𝕏", href: "https://twitter.com" },
  { label: "Instagram", icon: "📷", href: "https://instagram.com" },
  { label: "Facebook", icon: "📘", href: "https://facebook.com" },
];

export default function Footer() {
  const [popup, setPopup] = useState<Popup | null>(null);

  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-[1320px] px-6 py-12 text-sm text-ink-muted">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg text-ink-muted">Aura</p>
            <p className="mt-2 max-w-xs">
              Everyday electronics, home goods, and essentials — shipped from
              Pakistan, with clear pricing and no checkout upsells.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Your account
            </p>
            <ul className="space-y-2">
              <li><Link href="/account" className="hover:text-ink">Account</Link></li>
              <li><Link href="/orders" className="hover:text-ink">Orders</Link></li>
              <li><Link href="/cart" className="hover:text-ink">Bag</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Company
            </p>
            <ul className="space-y-2">
              {infoLinks.slice(0, 3).map((l) => (
                <li key={l.label}>
                  <button onClick={() => setPopup(l)} className="hover:text-ink">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Help
            </p>
            <ul className="space-y-2">
              {infoLinks.slice(3, 6).map((l) => (
                <li key={l.label}>
                  <button onClick={() => setPopup(l)} className="hover:text-ink">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex flex-wrap gap-4">
            {infoLinks.slice(6).map((l) => (
              <button key={l.label} onClick={() => setPopup(l)} className="hover:text-ink">
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line hover:border-brand"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center">&copy; {new Date().getFullYear()} Aura. Built as a product demo.</p>
      </div>

      <InfoDialog
        open={popup !== null}
        title={popup?.label ?? ""}
        message={popup?.message ?? ""}
        onClose={() => setPopup(null)}
      />
    </footer>
  );
}
