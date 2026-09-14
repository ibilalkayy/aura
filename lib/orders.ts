import { getSupabaseClient } from "@/lib/supabase/client";
import { decrementStock, incrementStock } from "@/lib/products";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderStatusKey = "placed" | "processing" | "shipped" | "delivered";

export const STATUS_ORDER: OrderStatusKey[] = ["placed", "processing", "shipped", "delivered"];

export const STATUS_LABELS: Record<OrderStatusKey, string> = {
  placed: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export type Order = {
  id: string;
  placedAt: string;
  name: string;
  address: string;
  items: OrderItem[];
  total: number;
  cancelled: boolean;
  cancelledAt?: string;
  status: OrderStatusKey;
  userId?: string;
  customerEmail?: string;
};

export async function placeOrder(params: {
  userId: string;
  name: string;
  address: string;
  items: OrderItem[];
  total: number;
}): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  // Reserve stock first, one item at a time. If anything fails partway
  // through, put back what was already reserved rather than leaving stock
  // silently short.
  const reserved: OrderItem[] = [];
  for (const item of params.items) {
    const success = await decrementStock(item.productId, item.quantity);
    if (!success) {
      for (const r of reserved) await incrementStock(r.productId, r.quantity);
      return {
        ok: false,
        error: `${item.name} doesn't have enough stock left. Update the quantity in your cart and try again.`,
      };
    }
    reserved.push(item);
  }

  const supabase = getSupabaseClient();
  const orderId = `AU-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    user_id: params.userId,
    name: params.name,
    address: params.address,
    total: params.total,
  });
  if (orderError) {
    for (const r of reserved) await incrementStock(r.productId, r.quantity);
    return { ok: false, error: orderError.message };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    params.items.map((i) => ({
      order_id: orderId,
      product_id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }))
  );
  if (itemsError) {
    for (const r of reserved) await incrementStock(r.productId, r.quantity);
    // Clean up the now-orphaned order row too — otherwise it's left behind
    // with a total but zero items, which would look broken in order history.
    await supabase.from("orders").delete().eq("id", orderId);
    return { ok: false, error: itemsError.message };
  }

  return { ok: true, orderId };
}

const ORDER_SELECT =
  "id, placed_at, name, address, total, cancelled, cancelled_at, status, user_id, order_items(product_id, name, price, quantity)";

type OrderRow = {
  id: string;
  placed_at: string;
  name: string;
  address: string;
  total: number | string;
  cancelled: boolean;
  cancelled_at: string | null;
  status: OrderStatusKey;
  user_id: string;
  order_items: { product_id: string; name: string; price: number | string; quantity: number }[] | null;
};

function mapOrder(o: OrderRow): Order {
  return {
    id: o.id,
    placedAt: o.placed_at,
    name: o.name,
    address: o.address,
    total: Number(o.total),
    cancelled: o.cancelled,
    cancelledAt: o.cancelled_at ?? undefined,
    status: o.status,
    userId: o.user_id,
    items: (o.order_items ?? []).map((i) => ({
      productId: i.product_id,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    })),
  };
}

export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("placed_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as OrderRow[]).map(mapOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapOrder(data as unknown as OrderRow);
}

export async function cancelOrder(id: string): Promise<{ ok: boolean; error?: string }> {
  const order = await getOrder(id);
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ cancelled: true, cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (order) {
    for (const item of order.items) {
      await incrementStock(item.productId, item.quantity);
    }
  }

  return { ok: true };
}

const CANCEL_WINDOW_HOURS = 24;

export function canCancelOrder(order: Order): boolean {
  if (order.cancelled) return false;
  const hoursElapsed = (Date.now() - new Date(order.placedAt).getTime()) / 3_600_000;
  return hoursElapsed < CANCEL_WINDOW_HOURS;
}

export type StatusStep = {
  key: OrderStatusKey;
  label: string;
  date: Date | null;
  reached: boolean;
};

export type StatusHistoryEntry = { status: OrderStatusKey; changedAt: string };

// Real per-stage dates, pulled from order_status_history — populated by the
// database trigger on order creation and by admin_set_order_status()
// whenever an admin advances an order. No stage is ever guessed or
// estimated from elapsed time; a stage not yet reached just shows "Pending".
export async function getOrderStatusHistory(orderId: string): Promise<StatusHistoryEntry[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("order_status_history")
    .select("status, changed_at")
    .eq("order_id", orderId)
    .order("changed_at", { ascending: true });

  return (data ?? []).map((r) => ({ status: r.status, changedAt: r.changed_at }));
}

export function buildStatusSteps(order: Order, history: StatusHistoryEntry[]): {
  steps: StatusStep[];
  currentIndex: number;
} {
  const dateByStatus = new Map(history.map((h) => [h.status, new Date(h.changedAt)]));
  const currentIndex = STATUS_ORDER.indexOf(order.status);

  const steps: StatusStep[] = STATUS_ORDER.map((key, i) => ({
    key,
    label: STATUS_LABELS[key],
    date: dateByStatus.get(key) ?? null,
    reached: i <= currentIndex,
  }));

  return { steps, currentIndex };
}

// ============================================================
// Admin-only
// ============================================================

export async function getAllOrdersForAdmin(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("placed_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as OrderRow[]).map(mapOrder);
}

export async function adminSetOrderStatus(
  orderId: string,
  status: OrderStatusKey
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_set_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Not authorized." };
  return { ok: true };
}
