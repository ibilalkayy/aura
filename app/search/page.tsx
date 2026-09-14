"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { categories, searchProducts, Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const sort = (searchParams.get("sort") as "price-asc" | "price-desc" | "rating" | null) ?? undefined;

  const [results, setResults] = useState<Product[] | null>(null);

  // Real query against Supabase every time the search params change — not a
  // client-side filter over a one-time full download.
  useEffect(() => {
    let active = true;
    setResults(null);
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">
          {q ? `Results for “${q}”` : category ? category : "All products"}
          {results !== null && (
            <span className="ml-2 text-base font-normal text-ink/50">
              ({results.length})
            </span>
          )}
        </h1>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink/50">Sort:</span>
          {[
            { key: "", label: "Featured" },
            { key: "price-asc", label: "Price: low to high" },
            { key: "price-desc", label: "Price: high to low" },
            { key: "rating", label: "Top rated" },
          ].map((opt) => (
            <Link
              key={opt.key}
              href={buildHref({ sort: opt.key || undefined })}
              className={`rounded-full border px-3 py-1.5 ${
                (sort || "") === opt.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink/70 hover:border-brand"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={buildHref({ category: undefined })}
          className={`rounded-full border px-3 py-1.5 text-xs ${
            !category ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70"
          }`}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={buildHref({ category: c })}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              category === c ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/70"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {results === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-4">
              <div className="aspect-square w-full animate-pulse rounded-xl bg-line" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-line" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-line" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-ink/60">
          Nothing matched that search. Try a different term or clear the filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
