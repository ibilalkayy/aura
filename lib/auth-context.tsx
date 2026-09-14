"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUp: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logOut: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, "firstName" | "lastName" | "phone" | "avatar">>) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string, email: string): Promise<User> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url, is_admin")
    .eq("id", userId)
    .single();

  return {
    id: userId,
    email,
    firstName: data?.first_name ?? "",
    lastName: data?.last_name ?? "",
    phone: data?.phone ?? undefined,
    avatar: data?.avatar_url ?? undefined,
    isAdmin: data?.is_admin ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session?.user) {
          setUser(await loadProfile(session.user.id, session.user.email ?? ""));
        }
      } catch {
        // Supabase isn't configured yet — treat as signed out rather than hanging.
      } finally {
        if (active) setLoading(false);
      }
    }
    init();

    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = getSupabaseClient();
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(await loadProfile(session.user.id, session.user.email ?? ""));
        } else {
          setUser(null);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch {
      // not configured — no listener to attach
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signUp = async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not sign up." };
    }
  };

  const logIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not log in." };
    }
  };

  const logOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(await loadProfile(session.user.id, session.user.email ?? ""));
    }
  };

  const updateUser: AuthContextValue["updateUser"] = async (updates) => {
    if (!user) return { ok: false, error: "Not signed in." };
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: updates.firstName ?? user.firstName,
          last_name: updates.lastName ?? user.lastName,
          phone: updates.phone ?? user.phone ?? null,
          avatar_url: updates.avatar ?? user.avatar ?? null,
        })
        .eq("id", user.id);
      if (error) return { ok: false, error: error.message };
      setUser({ ...user, ...updates });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not save changes." };
    }
  };

  const deleteAccount: AuthContextValue["deleteAccount"] = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { ok: false, error: "Not signed in." };

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) return { ok: false, error: body.error ?? "Could not delete account." };

      await supabase.auth.signOut();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not delete account." };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not send reset email." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not update password." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        logIn,
        logOut,
        updateUser,
        deleteAccount,
        refreshUser,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
