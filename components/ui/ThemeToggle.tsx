"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reading localStorage/matchMedia is only possible client-side, so this
    // sync-on-mount pattern is the correct use of an effect here (the value
    // can't be known during server render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme((window.localStorage.getItem("aura-theme") as Theme | null) ?? getSystemTheme());
  }, []);

  const toggle = () => {
    const next: Theme = (theme ?? getSystemTheme()) === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("aura-theme", next);
    } catch {
      // Best-effort — a blocked/full localStorage shouldn't break the toggle.
    }
  };

  // Deliberately NOT `theme ?? getSystemTheme()` here: getSystemTheme() reads
  // window.matchMedia, which only exists on the client. Falling back to it
  // during render would make the client's first render (before this
  // component's effect has run) differ from what the server rendered,
  // which is exactly a hydration mismatch. Rendering strictly from `theme`
  // (null until the mount effect sets it) keeps the first client render
  // identical to the server's, at the cost of a one-frame icon flash on
  // mount — the CSS theme itself has no flash, since ThemeScript sets
  // data-theme synchronously before paint.
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-brand hover:text-ink"
      }
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
