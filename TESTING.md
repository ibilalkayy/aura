# Testing

Two layers here, and they're genuinely different:

1. **Automated tests** (`npm test`) — real, runnable, checked into the repo.
   They cover pure logic and the orchestration logic in `lib/orders.ts` and
   `lib/products.ts` (stock reservation, rollback, cancellation), using
   mocked Supabase calls. They do **not** touch a real database.
2. **Manual checklist** (this document, below) — for everything that only a
   live Supabase project can actually prove: Row Level Security, realtime
   notifications, email delivery, storage upload policies. These aren't
   automated because doing so honestly would require a real test Supabase
   project with real credentials, which isn't something that can be spun up
   from inside this build. Treat the checklist as a required pre-deploy
   pass, not optional.

No browser/E2E tests (Playwright, Cypress) are included. Worth adding once
you have a deployed staging URL to point them at — flagged here rather than
included half-built and unverified.

---

## Running the automated tests

```bash
npm install        # picks up the new devDependencies (vitest, testing-library)
npm test            # runs once, prints pass/fail
npm run test:watch  # reruns on file changes, useful while iterating
```

No environment variables or Supabase project needed for these — that's the
point. If `npm test` fails on a machine that has never run `npm install`
for this project before, run `npm install` first.

### What's covered

| File | What it verifies |
|---|---|
| `tests/unit/shipping.test.ts` | `estimateDelivery` — domestic vs. far regions, unrecognized countries don't throw, min never exceeds max, case/whitespace handling |
| `tests/unit/countries.test.ts` | `flagEmoji`, `findCountryByName` — exact match, case-insensitivity, no partial/substring matches, no duplicate ISO codes in the dataset |
| `tests/unit/order-status.test.ts` | `canCancelOrder` at the 24h boundary (just under / just over), blocked on already-cancelled orders; `buildStatusSteps` marks the right stages reached, never fabricates a date for an unreached stage |
| `tests/unit/card-brand.test.ts` | `detectBrand` — Visa/Mastercard/Amex/Discover prefixes, unrecognized prefix falls back gracefully, spaces stripped, never throws on garbage input |
| `tests/integration/place-order.test.ts` | `placeOrder`'s stock reservation: succeeds when stock is available; rolls back **only** the items actually reserved when a later item is out of stock; rolls back **all** reserved stock if the order row fails to insert; rolls back stock **and deletes the orphaned order row** if `order_items` fails to insert (a real bug this test suite caught and the fix that's now in `lib/orders.ts`); never reserves stock for an empty cart |
| `tests/integration/cancel-order.test.ts` | `cancelOrder` restores the exact quantity for every item; restores **nothing** if the cancellation update itself fails; stays safe (doesn't throw, doesn't restore phantom stock) if the order can't be found |

`tests/helpers/supabase-mock.ts` is a small shared helper that mimics
Supabase's chainable, thenable query builder well enough to test our own
logic without a live database.

---

## Manual checklist — Security & Row Level Security

Do this against a real (ideally non-production) Supabase project, signed
in as two different test accounts — call them **A** and **B** — plus one
admin account.

- [ ] **Cross-user order access.** Sign in as A, place an order. Sign in as
      B. Confirm B's `/orders` never shows A's order, and navigating
      directly to `/orders/<A's order id>` shows "Order not found" (RLS
      blocking the row, not just the UI hiding a link).
- [ ] **Cross-user addresses/cards.** Same idea — A's saved addresses and
      payment methods should be completely invisible to B, even by ID.
- [ ] **Admin-only order status.** As a non-admin, try `POST
      /api/notify/order-status` directly (e.g. via curl or browser
      devtools) with a valid session token. Expect `403 Not authorized`.
- [ ] **Admin-only product writes.** As a non-admin signed-in user, try
      calling `adminUpdateProduct`/`adminCreateProduct`/`adminDeleteProduct`
      from the browser console on a real page. Expect the Supabase call
      itself to fail (RLS rejection), not just the UI button being hidden.
- [ ] **Admin-only variant/image writes.** Same check for
      `adminAddVariant`, `adminDeleteVariant`, `adminAddProductImage`,
      `adminDeleteProductImage`.
- [ ] **Stock can't be edited directly.** Confirm there's no client path
      that updates `products.stock` other than through
      `decrement_product_stock` / `increment_product_stock` — try a raw
      `update` from the console as a non-admin and confirm RLS blocks it
      (products only has an admin-gated update policy).
- [ ] **Notifications can't be spoofed.** As any signed-in user, try
      inserting a row into `notifications` directly from the browser
      console. Expect it to fail — there's deliberately no client insert
      policy on that table.
- [ ] **Account deletion requires a real session.** Call `POST
      /api/delete-account` with no `Authorization` header, then with an
      obviously invalid one. Expect `401` both times, and confirm no
      account was actually deleted.
- [ ] **Storage bucket policies.** As a non-admin, try uploading directly
      to the `product-images` bucket via the Supabase client. Expect
      rejection. Confirm avatar upload only ever writes to the signed-in
      user's own folder (`{user_id}/...`), never another user's.
- [ ] **Password reset link scope.** Request a reset link for account A,
      then try using the resulting session to change account B's password
      (shouldn't be reachable at all, but worth confirming the reset flow
      only ever updates the session's own user).

## Manual checklist — Edge cases by feature

**Auth**
- [ ] Sign up with an email that already has an account — clear error, not
      a silent failure.
- [ ] Log in with a wrong password — clear error, no account info leaked
      about whether the email itself exists.
- [ ] Password reset link used twice — second use should fail cleanly.
- [ ] Stale/expired reset link — lands on the "This link isn't valid" state,
      not a crash.

**Cart & checkout**
- [ ] Add an item, then have its stock drop to zero in another tab/admin
      session before checkout — checkout should fail with the "doesn't have
      enough stock" message, not silently oversell.
- [ ] Try to check out with an empty cart (e.g. by navigating to
      `/checkout` directly with nothing added) — should show "Nothing to
      check out," not a broken form.
- [ ] Guest (not signed in) hits `/checkout` — redirected to a sign-in
      prompt, cart contents preserved after signing in.
- [ ] Cart quantity selector never allows more than current stock.

**Stock**
- [ ] Product at exactly 1 unit — buying it should show "Out of stock"
      immediately after, and the "Only N left" warning should have shown
      "Only 1 left" right before.
- [ ] Two browser sessions try to buy the last unit at nearly the same
      time — only one should succeed (this is what
      `decrement_product_stock`'s atomic conditional update is for; worth
      an actual side-by-side manual test, not just trusting the SQL).

**Orders & cancellation**
- [ ] Cancel an order at 23h59m — succeeds. Try again at 24h01m (or fake it
      by checking `canCancelOrder` against an older `placedAt`) — button
      should be gone, not just disabled.
- [ ] Cancel an order, confirm stock actually increments back on the
      product page.
- [ ] Admin advances a cancelled order's status — shouldn't be possible;
      confirm the admin UI hides the status dropdown for cancelled orders.

**Reviews**
- [ ] Submit a review while signed out — should be impossible from the UI;
      confirm the API/RLS would also reject it if attempted directly.
- [ ] Submit two reviews on the same product from the same account — both
      should be allowed (no uniqueness constraint) unless you specifically
      want to prevent that; know which behavior you actually have.
- [ ] Product with zero reviews shows "No reviews yet," not a broken
      average or `NaN`.

**Notifications**
- [ ] Place an order in one tab while `/orders` (or any page) is open in
      another signed-in tab — the bell's unread count should update live,
      without a refresh.
- [ ] Notification link navigates to the right order and marks itself read
      on click.
- [ ] "Mark all read" actually clears the unread badge to zero.

**Admin**
- [ ] Delete a product that has existing orders referencing it — past
      orders should still display correctly (they store their own
      name/price snapshot), only future lookups by product ID (e.g.
      "frequently bought together") should gracefully stop referencing it.
- [ ] Create a product with a duplicate slug — decide whether that should
      be blocked (it currently isn't enforced at the DB level) and note it
      as a known gap if not.

**Delivery estimate & variants**
- [ ] Enter a country not in the ~120-country list — confirm the picker
      simply doesn't match anything rather than erroring.
- [ ] Product with no variants configured — the variant section doesn't
      render at all (not an empty box).
- [ ] Product with no gallery photos beyond the cover image — no
      arrows/thumbnails shown (already covered by an automated-adjacent
      check, but worth eyeballing).

---

## Recommended setup for running the manual checklist

Use a **separate Supabase project** for this pass, not your real/demo data
— running the RLS bypass attempts above is safest against something you
can freely reset. Seed it the same way as production
(`schema.sql` → `seed-products.sql` → `make-me-admin.sql` for your test
admin account), create two throwaway user accounts for the cross-user
checks, and don't reuse those credentials anywhere real.
