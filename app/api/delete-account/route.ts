import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell } from "@/lib/email";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  // Verify the token identifies a real, current session before deleting anything.
  const verifier = createClient(url, anonKey);
  const { data: { user }, error: verifyError } = await verifier.auth.getUser(token);

  if (verifyError || !user) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdminClient();
    // Cascading foreign keys in supabase/schema.sql remove the profile,
    // addresses, payment methods, and orders automatically.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Best-effort — a failed confirmation email should never block or
    // reverse an account deletion that already succeeded.
    if (user.email) {
      const html = emailShell(`
        <h2 style="font-size: 18px;">Your account has been deleted</h2>
        <p>Your Aura account, saved addresses, payment methods, and orders
        have all been permanently removed. If you didn't request this,
        it's too late to undo — but nothing here was tied to a real
        payment method or real personal risk, since this is a demo store.</p>
      `);
      await sendEmail({ to: user.email, subject: "Your Aura account has been deleted", html });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server is not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
