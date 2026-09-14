import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/products";
import Stars from "@/components/Stars";

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:border-brand/40 hover:shadow-sm ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-paper">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, 45vw"
          className="object-cover transition group-hover:scale-[1.03]"
        />
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-sm font-medium leading-snug text-ink line-clamp-2">
          {product.name}
        </p>
        <div className="mt-1">
          {product.reviewCount > 0 ? (
            <Stars rating={product.rating} count={product.reviewCount} size="sm" />
          ) : (
            <span className="text-xs text-ink/40">No reviews yet</span>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-ink">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-ink/40 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
        {!outOfStock && product.stock <= 5 && (
          <span className="mt-1 text-xs text-accent">Only {product.stock} left</span>
        )}
      </div>
    </Link>
  );
}
