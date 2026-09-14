import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell } from "@/lib/email";

type OrderItemRow = { name: string; price: number | string; quantity: number };

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  // Query as the caller themselves (their token), so Row Level Security
  // guarantees they can only ever fetch their own order — not anyone else's.
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, name, address, total, order_items(name, price, quantity)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const items = (order.order_items ?? []) as OrderItemRow[];
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;">${i.name} × ${i.quantity}</td><td style="padding:4px 0; text-align:right;">$${(
          Number(i.price) * i.quantity
        ).toFixed(2)}</td></tr>`
    )
    .join("");

  const html = emailShell(`
    <h2 style="font-size: 18px;">Order confirmed</h2>
    <p>Thanks, ${order.name}. Your order <strong>${order.id}</strong> is confirmed.</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      ${itemsHtml}
    </table>
    <p style="font-weight:600; font-size: 15px;">Total: $${Number(order.total).toFixed(2)}</p>
    <p style="color:#666; font-size: 13px;">Shipping to: ${order.address}</p>
  `);

  const result = await sendEmail({
    to: user.email,
    subject: `Order confirmed — ${order.id}`,
    html,
  });

  // The in-app notification is created regardless of whether the email
  // itself succeeded — email is optional (needs a Resend key configured),
  // but the notification should work out of the box.
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Order confirmed",
      message: `Your order ${order.id} is confirmed. Total: $${Number(order.total).toFixed(2)}.`,
      link: `/orders/${order.id}`,
    });
  } catch {
    // Notifications are best-effort too — never fail the request over this.
  }

  if (!result.ok) {
    return NextResponse.json({ ok: true, emailError: result.error });
  }
  return NextResponse.json({ ok: true });
}
