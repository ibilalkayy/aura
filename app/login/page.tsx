"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { logIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // A fixed test account for quick access while testing/demoing, so you
  // don't have to type credentials every time. You have to sign up once
  // with these exact credentials via /signup for this button to work —
  // it doesn't bypass real auth, it just autofills and submits it.
  const DEMO_EMAIL = "demo@aura.test";
  const DEMO_PASSWORD = "DemoPass123!";

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError(null);
    setSubmitting(true);
    const result = await logIn(loginEmail.trim().toLowerCase(), loginPassword);
    setSubmitting(false);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const onDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await doLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <div className="px-4">
      <AuthShell title="Log in" subtitle="Sign in with your email and password.">
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <PasswordInput required placeholder="Password" value={password} onChange={setPassword} />
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-brand">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <Button
          variant="outline"
          onClick={onDemoLogin}
          disabled={submitting}
          className="mt-3 w-full border-dashed"
        >
          Continue with demo account (testing)
        </Button>
        <p className="mt-4 text-sm text-ink-muted">
          No account yet?{" "}
          <Link href="/signup" className="text-brand hover:underline">
            Sign up
          </Link>
        </p>
      </AuthShell>
    </div>
  );
}
