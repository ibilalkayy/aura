import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../helpers/supabase-mock";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/products", () => ({
  decrementStock: vi.fn(),
  incrementStock: vi.fn(),
}));

import { placeOrder } from "@/lib/orders";
import { decrementStock, incrementStock } from "@/lib/products";

const baseParams = {
  userId: "user-1",
  name: "Test Buyer",
  address: "123 Test St",
  total: 30,
  items: [
    { productId: "1", name: "Widget", price: 10, quantity: 1 },
    { productId: "2", name: "Gadget", price: 20, quantity: 1 },
  ],
};

beforeEach(() => {
  vi.mocked(decrementStock).mockReset();
  vi.mocked(incrementStock).mockReset();
  fromMock.mockReset();
});

describe("placeOrder", () => {
  it("succeeds when every item has enough stock and both inserts succeed", async () => {
    vi.mocked(decrementStock).mockResolvedValue(true);
    fromMock.mockImplementation(() => makeChain({ error: null }));

    const result = await placeOrder(baseParams);

    expect(result.ok).toBe(true);
    expect(result.orderId).toMatch(/^AU-/);
    expect(decrementStock).toHaveBeenCalledTimes(2);
    expect(incrementStock).not.toHaveBeenCalled();
  });

  it("rolls back only the items already reserved when a later item is out of stock", async () => {
    // First item succeeds, second fails — this is the case a naive
    // implementation gets wrong (either not rolling back at all, or
    // rolling back items that were never actually reserved).
    vi.mocked(decrementStock)
      .mockResolvedValueOnce(true) // item 1 reserved
      .mockResolvedValueOnce(false); // item 2 out of stock

    const result = await placeOrder(baseParams);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Gadget");
    expect(incrementStock).toHaveBeenCalledTimes(1);
    expect(incrementStock).toHaveBeenCalledWith("1", 1);
    // Never even attempted to write the order once stock reservation failed.
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rolls back all reserved stock if the order row itself fails to insert", async () => {
    vi.mocked(decrementStock).mockResolvedValue(true);
    fromMock.mockImplementation((table: string) => {
      if (table === "orders") return makeChain({ error: { message: "insert failed" } });
      return makeChain({ error: null });
    });

    const result = await placeOrder(baseParams);

    expect(result.ok).toBe(false);
    expect(incrementStock).toHaveBeenCalledTimes(2);
    expect(incrementStock).toHaveBeenCalledWith("1", 1);
    expect(incrementStock).toHaveBeenCalledWith("2", 1);
  });

  it("rolls back stock AND deletes the orphaned order row if order_items fails to insert", async () => {
    vi.mocked(decrementStock).mockResolvedValue(true);
    const deleteMock = vi.fn(() => makeChain({ error: null }));

    fromMock.mockImplementation((table: string) => {
      if (table === "orders") {
        // First call: insert (succeeds). Second call: delete (cleanup).
        return { insert: () => makeChain({ error: null }), delete: deleteMock };
      }
      if (table === "order_items") return makeChain({ error: { message: "items insert failed" } });
      return makeChain({ error: null });
    });

    const result = await placeOrder(baseParams);

    expect(result.ok).toBe(false);
    expect(incrementStock).toHaveBeenCalledTimes(2);
    expect(deleteMock).toHaveBeenCalled(); // the orphaned order row gets cleaned up
  });

  it("never reserves stock for an empty item list and still returns a coherent result", async () => {
    vi.mocked(decrementStock).mockResolvedValue(true);
    fromMock.mockImplementation(() => makeChain({ error: null }));

    const result = await placeOrder({ ...baseParams, items: [], total: 0 });

    expect(decrementStock).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});
