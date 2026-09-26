"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";

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
      <div className="px-4">
        <AuthShell title="Check your email" subtitle="">
          <p className="text-sm text-ink-muted">
            If an account exists for {email}, a password reset link is on its way.
          </p>
          <Link href="/login" className="mt-6 inline-block text-brand hover:underline">
            Back to log in
          </Link>
        </AuthShell>
      </div>
    );
  }

  return (
    <div className="px-4">
      <AuthShell
        title="Reset your password"
        subtitle="Enter your email and we'll send you a link to set a new password."
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-ink-muted">
          <Link href="/login" className="text-brand hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthShell>
    </div>
  );
}
