"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signUp(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  const passwordLongEnough = password.length >= 6;

  return (
    <div className="px-4">
      <AuthShell
        title="Create account"
        subtitle="Your password is handled entirely by Supabase Auth — this app never sees or stores it."
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              required
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <PasswordInput
            required
            placeholder="Password (min. 6 characters)"
            minLength={6}
            value={password}
            onChange={setPassword}
          />
          {password.length > 0 && (
            <p className={`text-xs ${passwordLongEnough ? "text-sage-strong" : "text-ink-muted"}`}>
              {passwordLongEnough ? "✓" : "•"} At least 6 characters
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </AuthShell>
    </div>
  );
}
