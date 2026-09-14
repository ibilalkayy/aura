"use client";

import { useId } from "react";
import { countries } from "@/lib/countries";

export default function CountryInput({
  value,
  onChange,
  placeholder = "Country",
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const listId = useId();

  return (
    <>
      <input
        required={required}
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <datalist id={listId}>
        {countries.map((c) => (
          <option key={c.code} value={c.name} />
        ))}
      </datalist>
    </>
  );
}
