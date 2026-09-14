"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories, getAllProducts, getRecentlyViewed, Product } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    getAllProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (user) {
      getRecentlyViewed(user.id).then(setRecentlyViewed);
    } else {
      setRecentlyViewed([]);
    }
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20">
      <section className="grid gap-8 border-b border-line py-14 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
            Shop without the noise.
          </h1>
          <p className="mt-4 max-w-md text-ink/70">
            No sponsored listings, no ads bolted onto your checkout, no
            fifteen upsells before you can pay. Just the product you came
            for.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Browse everything
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(products ?? []).slice(0, 3).map((p) => (
            <div key={p.id} className="aspect-square overflow-hidden rounded-2xl bg-white border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-line py-10">
        <h2 className="font-display text-xl text-ink mb-4">Shop by category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/search?category=${encodeURIComponent(c)}`}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink hover:border-brand hover:text-brand"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="border-b border-line py-10">
          <h2 className="font-display text-xl text-ink mb-5">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="py-10">
        <h2 className="font-display text-xl text-ink mb-5">All products</h2>
        {products === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-line bg-white p-4">
                <div className="aspect-square w-full animate-pulse rounded-xl bg-line" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-line" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-line" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
