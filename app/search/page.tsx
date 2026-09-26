"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { categories, searchProducts, Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const sort = (searchParams.get("sort") as "price-asc" | "price-desc" | "rating" | null) ?? undefined;

  const [results, setResults] = useState<Product[] | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Real query against Supabase every time the search params change — not a
  // client-side filter over a one-time full download. "Load more" below is
  // purely a client-side reveal over that already-fetched result set, not
  // a second query — there's no server-side pagination to replace.
  useEffect(() => {
    let active = true;
    setResults(null);
    setVisible(PAGE_SIZE);
    searchProducts({ query: q, category, sort }).then((data) => {
      if (active) setResults(data);
    });
    return () => {
      active = false;
    };
  }, [q, category, sort]);

  const buildHref = (params: { q?: string; category?: string; sort?: string }) => {
    const merged = { q, category, sort, ...params };
    const usp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && usp.set(k, v));
    return `/search?${usp.toString()}`;
  };

  const shown = results?.slice(0, visible) ?? [];

  return (
    <div className="mx-auto max-w-[1320px] px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">
          {q ? `Results for “${q}”` : category ? category : "All products"}
          {results !== null && (
            <span className="ml-2 text-base font-normal text-ink-muted">
              ({results.length})
            </span>
          )}
        </h1>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Sort:</span>
          {[
            { key: "", label: "Featured" },
            { key: "price-asc", label: "Price: low to high" },
            { key: "price-desc", label: "Price: high to low" },
            { key: "rating", label: "Top rated" },
          ].map((opt) => (
            <Link
              key={opt.key}
              href={buildHref({ sort: opt.key || undefined })}
              className={cn(
                "rounded-full border px-3 py-1.5",
                (sort || "") === opt.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink-muted hover:border-brand"
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 overflow-x-auto">
        <Link
          href={buildHref({ category: undefined })}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs",
            !category ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-muted"
          )}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={buildHref({ category: c })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs",
              category === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-muted"
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {results === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-ink-muted">
          Nothing matched that search. Try a different term or clear the filters.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {visible < results.length && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
