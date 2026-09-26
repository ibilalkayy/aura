"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  categories,
  getAllProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  uploadProductImage,
  getProductVariants,
  adminAddVariant,
  adminDeleteVariant,
  getProductImages,
  adminAddProductImage,
  adminDeleteProductImage,
  Product,
  ProductInput,
  ProductVariant,
  ProductImage,
} from "@/lib/products";
import ConfirmDialog from "@/components/ConfirmDialog";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

const emptyForm: ProductInput = {
  slug: "",
  name: "",
  category: categories[0],
  price: 0,
  compareAtPrice: undefined,
  image: "",
  description: "",
  highlights: [],
  stock: 0,
};

function toFormInput(p: Product): ProductInput {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: p.image,
    description: p.description,
    highlights: p.highlights,
    stock: p.stock,
  };
}

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => getAllProducts().then(setProducts);

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Sign in required</h1>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Not authorized</h1>
        <p className="mt-2 text-sm text-ink-muted">This page is for admin accounts only.</p>
      </div>
    );
  }

  const onDelete = async (id: string) => {
    setError(null);
    const result = await adminDeleteProduct(id);
    if (!result.ok) {
      setError(result.error ?? "Could not delete product.");
    }
    setConfirmDeleteId(null);
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-sm text-ink-muted hover:text-ink">
        ← Admin
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Manage products</h1>
        <Button onClick={() => setCreating(true)}>+ Add product</Button>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {products === null ? (
        <p className="mt-6 text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper">
                <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                <p className="text-sm text-ink-muted">
                  {p.category} · ${p.price.toFixed(2)} · Stock: {p.stock}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted hover:border-brand hover:text-brand"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDeleteId(p.id)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted hover:border-danger hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title="Add product">
        <div className="p-5">
          <ProductForm
            initial={emptyForm}
            submitLabel="Create product"
            onCancel={() => setCreating(false)}
            onSubmit={async (input) => {
              const result = await adminCreateProduct(input);
              if (!result.ok) return result;
              setCreating(false);
              await load();
              return result;
            }}
          />
        </div>
      </Drawer>

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title="Edit product">
        {editing && (
          <div className="p-5">
            <ProductForm
              initial={toFormInput(editing)}
              productId={editing.id}
              submitLabel="Save changes"
              onCancel={() => setEditing(null)}
              onSubmit={async (input) => {
                const result = await adminUpdateProduct(editing.id, input);
                if (!result.ok) return result;
                setEditing(null);
                await load();
                return result;
              }}
            />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this product?"
        message="This removes it from the catalog along with its reviews and view history. Past orders that already included it are unaffected. This can't be undone."
        confirmLabel="Delete product"
        danger
        onConfirm={() => confirmDeleteId && onDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

function ProductForm({
  initial,
  productId,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initial: ProductInput;
  productId?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [slug, setSlug] = useState(initial.slug);
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [price, setPrice] = useState(String(initial.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial.compareAtPrice != null ? String(initial.compareAtPrice) : ""
  );
  const [image, setImage] = useState(initial.image);
  const [description, setDescription] = useState(initial.description);
  const [highlights, setHighlights] = useState(initial.highlights.join("\n"));
  const [stock, setStock] = useState(String(initial.stock));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const result = await uploadProductImage(file);
    setUploading(false);
    if (result.url) {
      setImage(result.url);
    } else {
      setError(result.error ?? "Could not upload image.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Upload a product image before saving.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      slug: slug.trim(),
      name: name.trim(),
      category,
      price: Number(price) || 0,
      compareAtPrice: compareAtPrice.trim() ? Number(compareAtPrice) : undefined,
      image,
      description: description.trim(),
      highlights: highlights
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
      stock: Math.max(0, Number(stock) || 0),
    });
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Could not save product.");
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-ink-muted">Product image</label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
            {image && <Image src={image} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <label className="inline-block cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink-muted hover:border-brand">
            {uploading ? "Uploading…" : image ? "Replace photo" : "Upload photo"}
            <input type="file" accept="image/*" onChange={onImageChange} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
        <input required placeholder="Slug (url-friendly-name)" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand">
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-3">
        <input required type="number" step="0.01" min="0" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
        <input type="number" step="0.01" min="0" placeholder="Compare-at price (optional)" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
        <input required type="number" min="0" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>
      <textarea required placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
      <textarea placeholder="Highlights, one per line" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />

      {productId && (
        <div className="space-y-4">
          <VariantManager productId={productId} />
          <GalleryManager productId={productId} />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VariantManager({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [optionType, setOptionType] = useState("");
  const [optionValue, setOptionValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => getProductVariants(productId).then(setVariants);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onAdd = async () => {
    if (!optionType.trim() || !optionValue.trim()) {
      setError("Enter both a type and a value.");
      return;
    }
    setError(null);
    const result = await adminAddVariant(productId, optionType.trim(), optionValue.trim());
    if (!result.ok) {
      setError(result.error ?? "Could not add variant.");
      return;
    }
    setOptionType("");
    setOptionValue("");
    await load();
  };

  const onDelete = async (id: string) => {
    await adminDeleteVariant(id);
    await load();
  };

  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper p-4">
      <p className="mb-1 text-sm font-medium text-ink">Variants</p>
      <p className="mb-3 text-xs text-ink-muted">
        Display-only options (e.g. Color, Size) — shown on the product page,
        but don&apos;t yet affect price, stock, or the bag.
      </p>

      {variants.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {variants.map((v) => (
            <span
              key={v.id}
              className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-muted"
            >
              {v.optionType}: {v.optionValue}
              <button onClick={() => onDelete(v.id)} className="text-ink-muted hover:text-danger">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          required
          placeholder="Type (e.g. Color)"
          value={optionType}
          onChange={(e) => setOptionType(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          required
          placeholder="Value (e.g. Red)"
          value={optionValue}
          onChange={(e) => setOptionValue(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <Button type="button" size="sm" onClick={onAdd}>
          Add
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function GalleryManager({ productId }: { productId: string }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => getProductImages(productId).then(setImages);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const uploadResult = await uploadProductImage(file);
    if (!uploadResult.url) {
      setError(uploadResult.error ?? "Could not upload photo.");
      setUploading(false);
      return;
    }
    const result = await adminAddProductImage(productId, uploadResult.url);
    if (!result.ok) setError(result.error ?? "Could not save photo.");
    await load();
    setUploading(false);
    e.target.value = "";
  };

  const onDelete = async (id: string) => {
    await adminDeleteProductImage(id);
    await load();
  };

  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper p-4">
      <p className="mb-1 text-sm font-medium text-ink">Additional photos</p>
      <p className="mb-3 text-xs text-ink-muted">
        Shown alongside the main product image in the product-page gallery.
      </p>

      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              <button
                onClick={() => onDelete(img.id)}
                aria-label="Remove photo"
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink/70 text-[10px] text-white hover:bg-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink-muted hover:border-brand">
        {uploading ? "Uploading…" : "+ Add photo"}
        <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
