import { describe, it, expect } from "vitest";
import { flagEmoji, findCountryByName, countries } from "@/lib/countries";

describe("flagEmoji", () => {
  it("generates a two-codepoint flag for a valid ISO code", () => {
    const flag = flagEmoji("PK");
    // Each regional indicator symbol is a surrogate pair (2 UTF-16 code units).
    expect(flag.length).toBe(4);
  });

  it("is case-insensitive", () => {
    expect(flagEmoji("pk")).toBe(flagEmoji("PK"));
  });

  it("produces a different flag for a different code", () => {
    expect(flagEmoji("US")).not.toBe(flagEmoji("GB"));
  });
});

describe("findCountryByName", () => {
  it("finds an exact match", () => {
    expect(findCountryByName("Pakistan")?.code).toBe("PK");
  });

  it("is case-insensitive", () => {
    expect(findCountryByName("pakistan")?.code).toBe("PK");
    expect(findCountryByName("PAKISTAN")?.code).toBe("PK");
  });

  it("tolerates surrounding whitespace", () => {
    expect(findCountryByName("  Pakistan  ")?.code).toBe("PK");
  });

  it("returns undefined for a name not in the list, rather than throwing", () => {
    expect(() => findCountryByName("Not A Real Country")).not.toThrow();
    expect(findCountryByName("Not A Real Country")).toBeUndefined();
  });

  it("does not partial-match a substring of a real country", () => {
    // "Pakist" should not match "Pakistan" — the picker requires an exact
    // selection, not a loose substring match, or two similarly-prefixed
    // countries could get confused for each other.
    expect(findCountryByName("Pakist")).toBeUndefined();
  });
});

describe("countries dataset", () => {
  it("has no duplicate ISO codes", () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every entry has a dial code starting with +", () => {
    for (const c of countries) {
      expect(c.dialCode.startsWith("+")).toBe(true);
    }
  });
});
