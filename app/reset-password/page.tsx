"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
      setTimeout(() => router.push("/account"), 1500);
    } else {
      setError(result.error ?? "Could not update password.");
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="px-4">
        <AuthShell title="This link isn't valid" subtitle="Reset links expire after a while, or may have already been used.">
          <Link href="/forgot-password" className="inline-block">
            <Button>Request a new link</Button>
          </Link>
        </AuthShell>
      </div>
    );
  }

  if (done) {
    return (
      <div className="px-4">
        <AuthShell title="Password updated" subtitle="Taking you to your account…">
          <div />
        </AuthShell>
      </div>
    );
  }

  return (
    <div className="px-4">
      <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
        <form onSubmit={onSubmit} className="space-y-3">
          <PasswordInput
            required
            placeholder="New password (min. 6 characters)"
            minLength={6}
            value={password}
            onChange={setPassword}
          />
          <PasswordInput
            required
            placeholder="Confirm new password"
            minLength={6}
            value={confirm}
            onChange={setConfirm}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </AuthShell>
    </div>
  );
}
