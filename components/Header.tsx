"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/NotificationBell";
import CommandPalette from "@/components/CommandPalette";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const { itemCount } = useCart();
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Global shortcuts: "/" or ⌘K / Ctrl+K opens the command-palette search,
  // unless focus is already in a text input/textarea (so "/" can still be
  // typed normally into a review, address, etc.).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link href="/" className="shrink-0 font-display text-xl text-ink sm:text-2xl">
          Aura
        </Link>

        <button
          onClick={() => setSearchOpen(true)}
          className="hidden flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-muted transition hover:border-brand sm:flex"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search for anything</span>
          <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-muted">
            ⌘K
          </span>
        </button>

        <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm sm:gap-5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="text-ink-muted hover:text-ink sm:hidden"
          >
            <Search size={20} />
          </button>

          <ThemeToggle className="hidden text-ink-muted transition hover:text-ink sm:flex" />

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-ink-muted hover:text-ink"
              >
                {user.firstName || "Account"}
                <span className="text-xs">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-muted hover:bg-paper hover:text-ink"
                  >
                    Account
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink-muted hover:bg-paper hover:text-ink"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-ink-muted hover:bg-paper hover:text-ink"
                  >
                    <span>Bag</span>
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
                      className="block px-4 py-2 text-sm text-ink-muted hover:bg-paper hover:text-ink"
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
                    className="block w-full border-t border-line px-4 py-2 text-left text-sm text-ink-muted hover:bg-paper hover:text-danger"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden text-ink-muted hover:text-ink sm:inline">
              Sign in
            </Link>
          )}
          {user ? (
            <NotificationBell />
          ) : (
            <Link href="/cart" className="relative hidden items-center gap-1.5 font-medium text-ink hover:text-brand sm:flex">
              <span>Bag</span>
              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
        </nav>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
