"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await requestPasswordReset(email.trim().toLowerCase());
    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink/60">
          If an account exists for {email}, a password reset link is on its way.
        </p>
        <Link href="/login" className="mt-6 inline-block text-brand hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-ink mb-1">Reset your password</h1>
      <p className="mb-6 text-sm text-ink/60">
        Enter your email and we'll send you a link to set a new password.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/60">
        <Link href="/login" className="text-brand hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
