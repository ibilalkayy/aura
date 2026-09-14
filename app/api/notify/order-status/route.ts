import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell } from "@/lib/email";

const STATUS_LABELS: Record<string, string> = {
  placed: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId;
  const status = body?.status;
  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const verifier = createClient(url, anonKey);
  const { data: { user }, error: verifyError } = await verifier.auth.getUser(token);
  if (verifyError || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  // Confirm the caller is actually an admin before telling anyone anything
  // about an order that isn't theirs.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, name, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const label = STATUS_LABELS[status] ?? status;

  // The in-app notification only needs the order's owner id, not their
  // email, so it doesn't depend on the email lookup/send succeeding.
  try {
    await admin.from("notifications").insert({
      user_id: order.user_id,
      title: "Order update",
      message: `Order ${order.id} is now: ${label}.`,
      link: `/orders/${order.id}`,
    });
  } catch {
    // Best-effort — never fail the status change over a notification issue.
  }

  const { data: customer, error: customerError } = await admin.auth.admin.getUserById(order.user_id);
  if (customerError || !customer.user?.email) {
    return NextResponse.json({ ok: true, emailError: "Could not find the customer's email." });
  }

  const html = emailShell(`
    <h2 style="font-size: 18px;">Order update</h2>
    <p>Hi ${order.name}, your order <strong>${order.id}</strong> is now:</p>
    <p style="font-size: 17px; font-weight: 600;">${label}</p>
  `);

  const result = await sendEmail({
    to: customer.user.email,
    subject: `Order ${order.id}: ${label}`,
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: true, emailError: result.error });
  }
  return NextResponse.json({ ok: true });
}
