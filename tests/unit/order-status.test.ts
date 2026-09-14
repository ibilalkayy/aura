import { describe, it, expect } from "vitest";
import { canCancelOrder, buildStatusSteps, STATUS_ORDER, type Order, type StatusHistoryEntry } from "@/lib/orders";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "AU-TEST123",
    placedAt: new Date().toISOString(),
    name: "Test Buyer",
    address: "123 Test St",
    items: [{ productId: "1", name: "Test Product", price: 10, quantity: 1 }],
    total: 10,
    cancelled: false,
    status: "placed",
    ...overrides,
  };
}

describe("canCancelOrder", () => {
  it("allows cancellation just after placing", () => {
    const order = makeOrder({ placedAt: new Date().toISOString() });
    expect(canCancelOrder(order)).toBe(true);
  });

  it("allows cancellation at 23 hours 59 minutes", () => {
    const almostADayAgo = new Date(Date.now() - (23 * 60 + 59) * 60_000).toISOString();
    const order = makeOrder({ placedAt: almostADayAgo });
    expect(canCancelOrder(order)).toBe(true);
  });

  it("blocks cancellation once 24 hours have passed", () => {
    const overADayAgo = new Date(Date.now() - 25 * 3_600_000).toISOString();
    const order = makeOrder({ placedAt: overADayAgo });
    expect(canCancelOrder(order)).toBe(false);
  });

  it("blocks cancellation on an already-cancelled order, even if recent", () => {
    const order = makeOrder({ placedAt: new Date().toISOString(), cancelled: true });
    expect(canCancelOrder(order)).toBe(false);
  });
});

describe("buildStatusSteps", () => {
  it("marks only 'placed' as reached with no history entries beyond it", () => {
    const order = makeOrder({ status: "placed" });
    const history: StatusHistoryEntry[] = [{ status: "placed", changedAt: order.placedAt }];
    const { steps, currentIndex } = buildStatusSteps(order, history);

    expect(currentIndex).toBe(0);
    expect(steps[0].reached).toBe(true);
    expect(steps[1].reached).toBe(false);
    expect(steps[1].date).toBeNull(); // not yet reached — no fabricated estimate
  });

  it("marks every stage up to and including the current status as reached", () => {
    const order = makeOrder({ status: "shipped" });
    const history: StatusHistoryEntry[] = [
      { status: "placed", changedAt: "2026-01-01T00:00:00Z" },
      { status: "processing", changedAt: "2026-01-01T01:00:00Z" },
      { status: "shipped", changedAt: "2026-01-01T06:00:00Z" },
    ];
    const { steps, currentIndex } = buildStatusSteps(order, history);

    expect(currentIndex).toBe(STATUS_ORDER.indexOf("shipped"));
    expect(steps.filter((s) => s.reached)).toHaveLength(3);
    expect(steps.find((s) => s.key === "shipped")?.date?.toISOString()).toBe("2026-01-01T06:00:00.000Z");
    expect(steps.find((s) => s.key === "delivered")?.reached).toBe(false);
  });

  it("gives a real date to every reached stage from history, never guessing one", () => {
    const order = makeOrder({ status: "processing" });
    const history: StatusHistoryEntry[] = [
      { status: "placed", changedAt: "2026-02-01T00:00:00Z" },
      { status: "processing", changedAt: "2026-02-01T02:00:00Z" },
    ];
    const { steps } = buildStatusSteps(order, history);

    const placedStep = steps.find((s) => s.key === "placed")!;
    const processingStep = steps.find((s) => s.key === "processing")!;
    expect(placedStep.date).not.toBeNull();
    expect(processingStep.date).not.toBeNull();
    expect(steps.find((s) => s.key === "shipped")!.date).toBeNull();
  });
});
