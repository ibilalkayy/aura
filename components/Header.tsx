"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const { itemCount } = useCart();
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="font-display text-xl text-ink shrink-0 sm:text-2xl">
            Aura
          </Link>

          <form onSubmit={onSearch} className="hidden flex-1 sm:block">
            <div className="flex overflow-hidden rounded-full border border-line bg-white focus-within:border-brand">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Search for anything"
                className="w-full bg-transparent px-4 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="px-4 text-base hover:opacity-70"
              >
                🔍
              </button>
            </div>
          </form>

          <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm sm:gap-5">
            {user ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 text-ink/70 hover:text-ink"
                >
                  {user.firstName || "Account"}
                  <span className="text-xs">▾</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
                    >
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
                    >
                      <span>Cart</span>
                      {itemCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
                          {itemCount}
                        </span>
                      )}
                    </Link>
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await logOut();
                        router.push("/");
                      }}
                      className="block w-full border-t border-line px-4 py-2 text-left text-sm text-ink/70 hover:bg-paper hover:text-accent"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-ink/70 hover:text-ink">
                Sign in
              </Link>
            )}
            {user ? (
              <NotificationBell />
            ) : (
              <Link href="/cart" className="relative flex items-center gap-1.5 font-medium text-ink hover:text-brand">
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
          </nav>
        </div>

        <form onSubmit={onSearch} className="mt-3 sm:hidden">
          <div className="flex overflow-hidden rounded-full border border-line bg-white focus-within:border-brand">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search for anything"
              className="w-full bg-transparent px-4 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="px-4 text-base hover:opacity-70"
            >
              🔍
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
