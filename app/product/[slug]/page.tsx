"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  searchProducts,
  getReviewsForProduct,
  addReview,
  recordView,
  getFrequentlyBoughtWith,
  getProductVariants,
  getProductImages,
  Product,
  Review,
  ProductVariant,
} from "@/lib/products";
import { getAddresses } from "@/lib/account-data";
import { estimateDelivery } from "@/lib/shipping";
import { useAuth } from "@/lib/auth-context";
import Stars from "@/components/Stars";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import CountryInput from "@/components/CountryInput";
import ProductGallery from "@/components/ProductGallery";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [relatedLabel, setRelatedLabel] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [deliveryCountry, setDeliveryCountry] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async (productId: string) => {
    setReviews(await getReviewsForProduct(productId));
  };

  useEffect(() => {
    let active = true;
    params.then(async ({ slug }) => {
      const p = await getProductBySlug(slug);
      if (!active) return;
      setProduct(p);
      if (p) {
        await loadReviews(p.id);

        // Real recommendation: what do people actually buy alongside this?
        // Falls back to same-category if there's no purchase history yet
        // (e.g. a fresh catalog with no orders).
        const boughtTogether = await getFrequentlyBoughtWith(p.id, 4);
        if (boughtTogether.length > 0) {
          setRelated(boughtTogether);
          setRelatedLabel("Frequently bought together");
        } else {
          const sameCategory = await searchProducts({ category: p.category });
          setRelated(sameCategory.filter((x) => x.id !== p.id).slice(0, 4));
          setRelatedLabel(`More in ${p.category}`);
        }

        const v = await getProductVariants(p.id);
        setVariants(v);
        const defaults: Record<string, string> = {};
        for (const opt of v) {
          if (!defaults[opt.optionType]) defaults[opt.optionType] = opt.optionValue;
        }
        setSelectedOptions(defaults);

        const extraImages = await getProductImages(p.id);
        setGalleryImages([p.image, ...extraImages.map((img) => img.url)]);

        if (user) recordView(user.id, p.id);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, user?.id]);

  useEffect(() => {
    if (!user) return;
    getAddresses().then((addresses) => {
      if (addresses.length > 0) setDeliveryCountry(addresses[0].country);
    });
  }, [user]);

  if (product === undefined) return null;
  if (product === null) notFound();

  const onSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const result = await addReview({
      productId: product.id,
      userId: user.id,
      authorName: `${user.firstName} ${user.lastName}`.trim() || "Anonymous",
      rating,
      title: title.trim(),
      body: body.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Could not submit review.");
      return;
    }
    setTitle("");
    setBody("");
    setRating(5);
    setShowForm(false);
    await loadReviews(product.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          images={galleryImages.length > 0 ? galleryImages : [product.image]}
          alt={product.name}
        />

        <div>
          <p className="text-sm text-brand">{product.category}</p>
          <h1 className="font-display mt-1 text-2xl text-ink md:text-3xl">
            {product.name}
          </h1>
          <div className="mt-2">
            {product.reviewCount > 0 ? (
              <Stars rating={product.rating} count={product.reviewCount} />
            ) : (
              <span className="text-sm text-ink/50">No reviews yet</span>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-ink/40 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="text-ink/50">Out of stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-accent">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-brand">In stock</span>
            )}
          </p>

          <p className="mt-4 text-ink/70">{product.description}</p>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink/70">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          {variants.length > 0 && (
            <div className="mt-5 space-y-3">
              {Array.from(new Set(variants.map((v) => v.optionType))).map((optionType) => (
                <div key={optionType}>
                  <p className="mb-1.5 text-xs text-ink/50">{optionType}</p>
                  <div className="flex flex-wrap gap-2">
                    {variants
                      .filter((v) => v.optionType === optionType)
                      .map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [optionType]: v.optionValue }))}
                          className={`rounded-full border px-3 py-1.5 text-sm ${
                            selectedOptions[optionType] === v.optionValue
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-white text-ink/70 hover:border-brand"
                          }`}
                        >
                          {v.optionValue}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-ink/40">
                Selecting an option doesn&apos;t change price or stock yet — this store
                doesn&apos;t track inventory per variant.
              </p>
            </div>
          )}

          <div className="mt-6">
            <AddToCart productId={product.id} stock={product.stock} />
          </div>

          <div className="mt-6 rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-sm font-medium text-ink">Estimate delivery</p>
            <CountryInput
              value={deliveryCountry}
              onChange={setDeliveryCountry}
              placeholder="Enter your country"
            />
            {deliveryCountry &&
              (() => {
                const est = estimateDelivery(deliveryCountry);
                return (
                  <p className="mt-2 text-sm text-ink/70">
                    <span className="font-medium text-ink">
                      {est.min}–{est.max} business days
                    </span>{" "}
                    to {deliveryCountry} ({est.region}), shipping from Pakistan.
                  </p>
                );
              })()}
            <p className="mt-2 text-xs text-ink/40">
              Estimate only, based on region — not a live carrier quote.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-line pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">
            Customer reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>
          {user ? (
            !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand hover:text-white"
              >
                Write a review
              </button>
            )
          ) : (
            <a href="/login" className="text-sm text-brand hover:underline">
              Sign in to write a review
            </a>
          )}
        </div>

        {showForm && (
          <form onSubmit={onSubmitReview} className="mt-5 space-y-3 rounded-2xl border border-line bg-white p-5">
            <div>
              <label className="mb-1 block text-xs text-ink/50">Your rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`text-2xl ${n <= rating ? "text-accent" : "text-line"}`}
                    aria-label={`${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <input
              required
              placeholder="Review title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <textarea
              required
              placeholder="What did you think of this product?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            {error && <p className="text-sm text-accent">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? "Posting…" : "Post review"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-line px-6 py-2.5 text-sm text-ink/70 hover:border-brand"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {reviews.length === 0 && !showForm && (
            <p className="text-sm text-ink/50">
              No reviews yet — be the first to write one.
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-white p-4">
              <Stars rating={r.rating} size="sm" />
              <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>
              <p className="mt-1 text-sm text-ink/60">{r.body}</p>
              <p className="mt-2 text-xs text-ink/40">
                — {r.authorName} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="font-display text-xl text-ink mb-5">
            {relatedLabel}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
