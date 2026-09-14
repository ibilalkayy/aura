"use client";

import { useId, useState } from "react";
import { countries, findCountryByName, flagEmoji } from "@/lib/countries";

// value is stored as a single string like "+1 5551234567"
function splitPhone(value: string): { countryName: string; dialCode: string; local: string } {
  const match = countries
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => value.startsWith(c.dialCode + " "));
  if (match) {
    return {
      countryName: match.name,
      dialCode: match.dialCode,
      local: value.slice(match.dialCode.length + 1),
    };
  }
  return { countryName: "", dialCode: "", local: value };
}

export default function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const initial = splitPhone(value);
  const [countryName, setCountryName] = useState(initial.countryName);
  const [local, setLocal] = useState(initial.local);

  const matched = findCountryByName(countryName);

  const emit = (nextCountryName: string, nextLocal: string) => {
    const country = findCountryByName(nextCountryName);
    const combined = country ? `${country.dialCode} ${nextLocal}`.trim() : nextLocal;
    onChange(combined);
  };

  return (
    <div className="flex gap-2">
      <div className="relative w-36 shrink-0">
        <input
          list={listId}
          placeholder="Country"
          value={countryName}
          onChange={(e) => {
            setCountryName(e.target.value);
            emit(e.target.value, local);
          }}
          className="w-full rounded-lg border border-line py-2.5 pl-8 pr-2 text-sm outline-none focus:border-brand"
        />
        {matched && (
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm">
            {flagEmoji(matched.code)}
          </span>
        )}
        <datalist id={listId}>
          {countries.map((c) => (
            <option key={c.code} value={c.name} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-line focus-within:border-brand">
        {matched && (
          <span className="shrink-0 px-2 text-sm text-ink/60">{matched.dialCode}</span>
        )}
        <input
          type="tel"
          placeholder="Phone number"
          value={local}
          onChange={(e) => {
            setLocal(e.target.value);
            emit(countryName, e.target.value);
          }}
          className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none"
        />
      </div>
    </div>
  );
}
