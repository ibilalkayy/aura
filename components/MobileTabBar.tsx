"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function MobileTabBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();

  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
    { href: "/cart", label: "Bag", icon: ShoppingBag, match: (p: string) => p === "/cart" || p === "/checkout" },
    {
      href: user ? "/account" : "/login",
      label: user ? "Account" : "Sign in",
      icon: User,
      match: (p: string) => p === "/account" || p === "/login",
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur sm:hidden"
      aria-label="Primary"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-brand" : "text-ink-muted"
            )}
          >
            <span className="relative">
              <Icon size={20} />
              {tab.label === "Bag" && itemCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
