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

import { cancelOrder } from "@/lib/orders";
import { incrementStock } from "@/lib/products";

const orderRow = {
  id: "AU-CANCELME",
  placed_at: new Date().toISOString(),
  name: "Test Buyer",
  address: "123 Test St",
  total: 50,
  cancelled: false,
  cancelled_at: null,
  status: "placed",
  user_id: "user-1",
  order_items: [
    { product_id: "1", name: "Widget", price: 10, quantity: 2 },
    { product_id: "2", name: "Gadget", price: 30, quantity: 1 },
  ],
};

beforeEach(() => {
  vi.mocked(incrementStock).mockReset();
  fromMock.mockReset();
});

describe("cancelOrder", () => {
  it("restores stock for every item in the order, with the correct quantities", async () => {
    fromMock
      .mockImplementationOnce(() => makeChain({ data: orderRow, error: null })) // getOrder's select
      .mockImplementationOnce(() => makeChain({ error: null })); // the cancellation update

    const result = await cancelOrder("AU-CANCELME");

    expect(result.ok).toBe(true);
    expect(incrementStock).toHaveBeenCalledTimes(2);
    expect(incrementStock).toHaveBeenCalledWith("1", 2);
    expect(incrementStock).toHaveBeenCalledWith("2", 1);
  });

  it("does not restore any stock if the cancellation update itself fails", async () => {
    fromMock
      .mockImplementationOnce(() => makeChain({ data: orderRow, error: null }))
      .mockImplementationOnce(() => makeChain({ error: { message: "update failed" } }));

    const result = await cancelOrder("AU-CANCELME");

    expect(result.ok).toBe(false);
    expect(incrementStock).not.toHaveBeenCalled();
  });

  it("does not throw if the order can't be found (defensive — the UI shouldn't reach this, but the function should stay safe)", async () => {
    fromMock
      .mockImplementationOnce(() => makeChain({ data: null, error: { message: "not found" } }))
      .mockImplementationOnce(() => makeChain({ error: null }));

    const result = await cancelOrder("AU-DOES-NOT-EXIST");

    expect(result.ok).toBe(true); // the cancellation update itself still succeeded
    expect(incrementStock).not.toHaveBeenCalled(); // nothing to restore for an unknown order
  });
});
