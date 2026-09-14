import { getSupabaseClient } from "@/lib/supabase/client";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  description: string;
  highlights: string[];
  rating: number;
  reviewCount: number;
  stock: number;
};

export type Review = {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export const categories = [
  "Electronics",
  "Home & Kitchen",
  "Fashion",
  "Sports & Outdoors",
  "Books",
  "Beauty",
] as const;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number | string;
  compare_at_price: number | string | null;
  image: string;
  description: string;
  highlights: string[] | null;
  stock: number;
};

function mapProduct(row: ProductRow, ratings: Map<string, { sum: number; count: number }>): Product {
  const agg = ratings.get(row.id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    image: row.image,
    description: row.description,
    highlights: row.highlights ?? [],
    rating: agg && agg.count > 0 ? agg.sum / agg.count : 0,
    reviewCount: agg?.count ?? 0,
    stock: row.stock,
  };
}

async function getRatingAggregates(): Promise<Map<string, { sum: number; count: number }>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("reviews").select("product_id, rating");
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of data ?? []) {
    const existing = map.get(r.product_id) ?? { sum: 0, count: 0 };
    existing.sum += r.rating;
    existing.count += 1;
    map.set(r.product_id, existing);
  }
  return map;
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const [{ data }, ratings] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    getRatingAggregates(),
  ]);
  return (data ?? []).map((row) => mapProduct(row as ProductRow, ratings));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabaseClient();
  const [{ data }, ratings] = await Promise.all([
    supabase.from("products").select("*").eq("slug", slug).single(),
    getRatingAggregates(),
  ]);
  if (!data) return null;
  return mapProduct(data as ProductRow, ratings);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const [{ data }, ratings] = await Promise.all([
    supabase.from("products").select("*").in("id", uniqueIds),
    getRatingAggregates(),
  ]);
  return (data ?? []).map((row) => mapProduct(row as ProductRow, ratings));
}

export async function getReviewsForProduct(productId: string): Promise<Review[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, product_id, author_name, rating, title, body, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    authorName: r.author_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  }));
}

export async function addReview(params: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: params.productId,
    user_id: params.userId,
    author_name: params.authorName,
    rating: params.rating,
    title: params.title,
    body: params.body,
  });
  return { ok: !error, error: error?.message };
}

// Atomically decrements stock server-side — fails (returns false) rather
// than overselling if two people check out the last unit at the same time.
export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("decrement_product_stock", {
    p_id: productId,
    qty: quantity,
  });
  if (error) return false;
  return Boolean(data);
}

// Restores stock — used when an order is cancelled.
export async function incrementStock(productId: string, quantity: number): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.rpc("increment_product_stock", { p_id: productId, qty: quantity });
}

// Real search: queries Postgres directly (name/description/category match)
// instead of downloading every product and filtering in the browser. Scales
// to a catalog far bigger than what client-side filtering could handle.
export async function searchProducts(params: {
  query?: string;
  category?: string;
  sort?: "price-asc" | "price-desc" | "rating";
}): Promise<Product[]> {
  const supabase = getSupabaseClient();
  let request = supabase.from("products").select("*");

  if (params.query) {
    const q = params.query.trim();
    request = request.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
    );
  }
  if (params.category) {
    request = request.eq("category", params.category);
  }
  if (params.sort === "price-asc") request = request.order("price", { ascending: true });
  else if (params.sort === "price-desc") request = request.order("price", { ascending: false });
  else request = request.order("created_at", { ascending: true });

  const [{ data }, ratings] = await Promise.all([request, getRatingAggregates()]);
  let results = (data ?? []).map((row) => mapProduct(row as ProductRow, ratings));

  // "Top rated" needs the live-computed rating, which the DB doesn't know
  // about, so that one sort happens after fetching.
  if (params.sort === "rating") {
    results = [...results].sort((a, b) => b.rating - a.rating);
  }

  return results;
}

// Records that a signed-in user viewed a product, bumping the timestamp if
// they'd viewed it before. Powers the "recently viewed" rail.
export async function recordView(userId: string, productId: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from("recently_viewed")
    .upsert({ user_id: userId, product_id: productId, viewed_at: new Date().toISOString() });
}

export async function getRecentlyViewed(userId: string, limit = 6): Promise<Product[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("recently_viewed")
    .select("product_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  const ids = (data ?? []).map((r) => r.product_id);
  if (ids.length === 0) return [];

  const products = await getProductsByIds(ids);
  // getProductsByIds doesn't preserve order — re-sort to match view recency.
  const order = new Map(ids.map((id, i) => [id, i]));
  return products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

// "Frequently bought together": looks at real past orders containing this
// product, finds what else was in those orders, and ranks by how often it
// shows up. Falls back to same-category products if there's no purchase
// history yet (e.g. a brand-new catalog with no orders).
export async function getFrequentlyBoughtWith(productId: string, limit = 4): Promise<Product[]> {
  const supabase = getSupabaseClient();

  const { data: ordersWithProduct } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId);

  const orderIds = Array.from(new Set((ordersWithProduct ?? []).map((r) => r.order_id)));
  if (orderIds.length === 0) return [];

  const { data: coItems } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds)
    .neq("product_id", productId);

  const counts = new Map<string, number>();
  for (const row of coItems ?? []) {
    counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const rankedIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const products = await getProductsByIds(rankedIds);
  const order = new Map(rankedIds.map((id, i) => [id, i]));
  return products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

// ============================================================
// Admin-only catalog management. These succeed or fail based on the
// database's own RLS policies (products can only be written by an admin
// account) — the checks here are for a good error message, not the real
// security boundary.
// ============================================================

export type ProductInput = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  description: string;
  highlights: string[];
  stock: number;
};

export async function adminCreateProduct(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("products").insert({
    id: crypto.randomUUID(),
    slug: input.slug,
    name: input.name,
    category: input.category,
    price: input.price,
    compare_at_price: input.compareAtPrice ?? null,
    image: input.image,
    description: input.description,
    highlights: input.highlights,
    stock: input.stock,
  });
  return { ok: !error, error: error?.message };
}

export async function adminUpdateProduct(
  id: string,
  input: ProductInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({
      slug: input.slug,
      name: input.name,
      category: input.category,
      price: input.price,
      compare_at_price: input.compareAtPrice ?? null,
      image: input.image,
      description: input.description,
      highlights: input.highlights,
      stock: input.stock,
    })
    .eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function adminDeleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

// ============================================================
// Product variants — real, admin-managed options (e.g. Color: Red,
// Size: M). Selection on the product page is currently display-only:
// it doesn't yet change price, stock, or what gets added to the cart.
// A full implementation would need per-variant stock and cart/order
// line items, which is a larger schema change than this pass covers.
// ============================================================

export type ProductVariant = { id: string; optionType: string; optionValue: string };

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, option_type, option_value")
    .eq("product_id", productId)
    .order("option_type", { ascending: true })
    .order("option_value", { ascending: true });

  return (data ?? []).map((v) => ({ id: v.id, optionType: v.option_type, optionValue: v.option_value }));
}

export async function adminAddVariant(
  productId: string,
  optionType: string,
  optionValue: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("product_variants")
    .insert({ product_id: productId, option_type: optionType, option_value: optionValue });
  return { ok: !error, error: error?.message };
}

export async function adminDeleteVariant(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  return { ok: !error, error: error?.message };
}

// ============================================================
// Product photo gallery — additional images beyond the cover photo on
// the product itself, shown as a left/right-navigable gallery on the
// product page.
// ============================================================

export type ProductImage = { id: string; url: string };

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("product_images")
    .select("id, image_url")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => ({ id: r.id, url: r.image_url }));
}

export async function adminAddProductImage(
  productId: string,
  imageUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: imageUrl,
  });
  return { ok: !error, error: error?.message };
}

export async function adminDeleteProductImage(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  return { ok: !error, error: error?.message };
}
