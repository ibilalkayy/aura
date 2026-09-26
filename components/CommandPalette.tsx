"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { searchProducts, Product } from "@/lib/products";

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset on open — intentional, mirrors the reset-on-mount pattern
      // used elsewhere for state that can't be known ahead of the effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults(null);
      // Focus after the panel has mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced live search against the real product query — not a
  // client-side filter over a preloaded list.
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }
    let active = true;
    const handle = setTimeout(() => {
      searchProducts({ query: query.trim() }).then((data) => {
        if (active) setResults(data.slice(0, 8));
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goToProduct = (slug: string) => {
    onClose();
    router.push(`/product/${slug}`);
  };

  const goToFullSearch = () => {
    onClose();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToFullSearch();
          }}
          className="flex items-center gap-3 border-b border-line px-4 py-3.5"
        >
          <Search size={18} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 text-ink-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </form>

        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() === "" ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Start typing to search the catalog, or press Enter for full results.
            </p>
          ) : results === null ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              Nothing matched &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => goToProduct(p.slug)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                      <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.category}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-ink">
                      ${p.price.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results !== null && results.length > 0 && (
            <button
              type="button"
              onClick={goToFullSearch}
              className="block w-full border-t border-line px-4 py-3 text-center text-sm text-brand hover:bg-paper"
            >
              See all results for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
