import { describe, it, expect } from "vitest";
import { estimateDelivery } from "@/lib/shipping";

describe("estimateDelivery", () => {
  it("treats Pakistan as domestic with the fastest window", () => {
    const result = estimateDelivery("Pakistan");
    expect(result.region).toBe("Domestic (within Pakistan)");
    expect(result.min).toBeLessThan(result.max);
    expect(result.min).toBeGreaterThan(0);
  });

  it("treats neighboring countries faster than far ones", () => {
    const neighbor = estimateDelivery("India");
    const far = estimateDelivery("United States");
    expect(neighbor.max).toBeLessThan(far.max);
  });

  it("classifies an unrecognized country into a fallback region rather than throwing", () => {
    expect(() => estimateDelivery("Atlantis")).not.toThrow();
    const result = estimateDelivery("Atlantis");
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
  });

  it("is case- and whitespace-insensitive for the domestic check", () => {
    expect(estimateDelivery("  pakistan  ").region).toBe("Domestic (within Pakistan)");
    expect(estimateDelivery("PAKISTAN").region).toBe("Domestic (within Pakistan)");
  });

  it("every region's max is never less than its min", () => {
    const samples = ["Pakistan", "India", "China", "Germany", "United States", "Nigeria", "Japan", "Unknownland"];
    for (const country of samples) {
      const { min, max } = estimateDelivery(country);
      expect(max).toBeGreaterThanOrEqual(min);
    }
  });
});
