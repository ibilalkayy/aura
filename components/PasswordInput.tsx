"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        required={required}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line px-4 py-2.5 pr-11 text-sm outline-none focus:border-brand"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm hover:opacity-70"
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
