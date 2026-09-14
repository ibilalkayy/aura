import { getSupabaseClient } from "@/lib/supabase/client";

export type Address = {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type PaymentMethod = {
  id: string;
  cardHolder: string;
  brand: string;
  last4: string;
  expiry: string;
};

export async function getAddresses(): Promise<Address[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, full_name, street, city, state, postal_code, country, phone")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.full_name,
    street: a.street,
    city: a.city,
    state: a.state ?? "",
    postalCode: a.postal_code,
    country: a.country,
    phone: a.phone ?? undefined,
  }));
}

export async function addAddress(userId: string, address: Omit<Address, "id">) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("addresses").insert({
    user_id: userId,
    label: address.label,
    full_name: address.fullName,
    street: address.street,
    city: address.city,
    state: address.state || null,
    postal_code: address.postalCode,
    country: address.country,
    phone: address.phone || null,
  });
  return { ok: !error, error: error?.message };
}

export async function deleteAddress(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  return { ok: !error, error: error?.message };
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, card_holder, brand, last4, expiry")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((m) => ({
    id: m.id,
    cardHolder: m.card_holder,
    brand: m.brand,
    last4: m.last4,
    expiry: m.expiry,
  }));
}

export async function addPaymentMethod(userId: string, pm: Omit<PaymentMethod, "id">) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("payment_methods").insert({
    user_id: userId,
    card_holder: pm.cardHolder,
    brand: pm.brand,
    last4: pm.last4,
    expiry: pm.expiry,
  });
  return { ok: !error, error: error?.message };
}

export async function deletePaymentMethod(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  return { ok: !error, error: error?.message };
}

export function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}

export async function uploadAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}
