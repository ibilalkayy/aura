"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories, getAllProducts, getRecentlyViewed, Product } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

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
    <div className="mx-auto max-w-[1320px] px-6 pb-20">
      <section className="grid gap-10 border-b border-line py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h1 className="font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Shop without the noise.
          </h1>
          <p className="mt-5 max-w-md text-base text-ink-muted">
            No sponsored listings, no ads bolted onto your checkout, no
            fifteen upsells before you can pay. Just the product you came
            for.
          </p>
          <Link href="/search" className="mt-8 inline-block">
            <Button size="lg">Browse everything</Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(products ?? []).slice(0, 3).map((p) => (
            <div key={p.id} className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface">
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
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand"
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
              <ProductCardSkeleton key={i} />
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
