import { describe, it, expect } from "vitest";
import { detectBrand } from "@/lib/account-data";

describe("detectBrand", () => {
  it("detects Visa from a 4-prefixed number", () => {
    expect(detectBrand("4111111111111111")).toBe("Visa");
  });

  it("detects Mastercard from a 51-55 prefix", () => {
    expect(detectBrand("5500000000000004")).toBe("Mastercard");
  });

  it("detects Amex from a 34/37 prefix", () => {
    expect(detectBrand("340000000000009")).toBe("Amex");
    expect(detectBrand("370000000000002")).toBe("Amex");
  });

  it("detects Discover from a 6011/65 prefix", () => {
    expect(detectBrand("6011000000000004")).toBe("Discover");
  });

  it("falls back to a generic label for an unrecognized prefix", () => {
    expect(detectBrand("9999999999999999")).toBe("Card");
  });

  it("ignores spaces in the input", () => {
    expect(detectBrand("4111 1111 1111 1111")).toBe("Visa");
  });

  it("never throws on garbage input", () => {
    expect(() => detectBrand("")).not.toThrow();
    expect(() => detectBrand("not a card number")).not.toThrow();
  });
});
