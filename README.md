# Aura — a calmer, ad-free way to shop online

Built for a "rebuild a live product" challenge. Originally scoped as an
Amazon clone; the brief later changed to require an original design instead
— this is that redesign ("Aura Editorial"): the idea, backend, and database
stayed exactly the same, only the frontend's layout and visual design
changed. Backed by Supabase throughout: real auth, a real database, real
per-user data isolation.

## Design

The frontend follows an "Aura Editorial" direction: Fraunces (display) +
Instrument Sans (body), a warm paper/ink palette with sage/amber/danger
accent tokens, pill buttons, 4:5 product photography, light and dark mode,
and a command-palette search (⌘K / `/`) in place of a plain search bar. No
layout, component, or copy in this app was carried over from Amazon or any
other existing marketplace — every screen was designed from scratch against
this system. Built in phases on the `redesign/editorial` branch, each one
tested and built before moving to the next: design tokens & primitives →
global shell → home/search → product page → bag → checkout → auth → orders/
notifications/account/admin → final accessibility and consistency pass.
Every existing feature and every route URL was kept working throughout —
only `lib/**`, `supabase/**`, and `app/api/**` were left untouched; nothing
in this section changed what the app does, only how it looks.

## What's here
- Home, search + filter/sort, product detail, cart, checkout,
  order confirmation, order history with status tracking and cancellation
- Product catalog lives in a real Postgres table (`products`), not a
  hardcoded file — editable via SQL without a redeploy
- Reviews are real and user-submitted: any signed-in user can write one on
  a product page, tied to their account. Ratings and review counts are
  computed live from actual review rows, not stored as fixed numbers
- Real stock tracking: every checkout reserves stock atomically (a Postgres
  function, not a client-side check, so two people can't both buy the last
  unit), cancelling an order restores it, and the UI reflects it live —
  "only N left" warnings, disabled buttons and an "out of stock" badge when
  a product hits zero
- Search queries Postgres directly (name/description/category, with sort),
  not a client-side filter over a full download of the catalog
- "Frequently bought together" is computed from real past orders — what
  else showed up in orders containing this product — not a fixed
  same-category rule. Falls back to same-category when there's no purchase
  history yet (e.g. a fresh install with no orders)
- A "Recently viewed" rail on the home page for signed-in users, built from
  actual product views, not a static list
- Order status (Placed → Processing → Shipped → Delivered) is now real, not
  simulated from elapsed time. An admin account can advance any order's
  status from `/admin/orders`; each stage's date is the real moment it was
  set, and a stage not yet reached shows "Pending" rather than a guessed
  date. There's still no real courier or warehouse behind this — it's a
  deliberate admin-action model instead of a fake shipping-API integration
- Notification bell (replacing the standalone cart icon for signed-in
  users, since cart is one click away in the account dropdown): a real,
  database-backed notification appears the moment an order is confirmed or
  its status changes — live, via Supabase Realtime, not polling. It fires
  independently of whether the matching email actually sends, so it works
  even without Resend configured
- Real email notifications (optional, via Resend): order confirmation on
  checkout, a status-update email whenever an admin advances an order, and
  an account-deletion confirmation. Everything else in the app still works
  without this configured — emails just silently don't send
- Delivery estimate on each product page: enter (or auto-fill from a saved
  address) a destination country and see an estimated delivery window from
  Pakistan. A region-based heuristic, not a live carrier quote — disclosed
  as such on the page
- Product variants (e.g. Color, Size), managed per-product from the admin
  panel and shown as selectable options on the product page. Currently
  display-only — selecting one doesn't yet change price, stock, or what
  gets added to the cart; that would need per-variant inventory and cart
  line items, a larger change than this pass covers
- A real multi-photo gallery per product: admins upload additional photos
  from `/admin/products`, and the product page shows them with left/right
  navigation and a thumbnail strip, not just one static image
- A real admin area (`/admin`) gated to accounts with `is_admin = true`:
  add, edit, or delete any product — name, price, stock, description,
  images — without touching code or SQL, and advance order status from the
  same place. Product images are uploaded directly (Supabase Storage), not
  pasted in as a URL. Enforced by Postgres itself (RLS policies check admin
  status on every write, including image uploads), not just a hidden page
- Real auth (Supabase Auth, email + password), stored server-side
- Account: personal details, avatar upload (Supabase Storage), saved
  addresses (with a real country picker), saved payment methods (name/
  brand/last4/expiry only — full card numbers and CVCs are never stored),
  account deletion
- All of it is per-user and persisted in a real Postgres database, not
  the browser — sign in on a different device and it's all still there
- An order can no longer be cancelled once it's marked Shipped or
  Delivered, regardless of the 24-hour window — the order detail page
  explains why instead of just hiding the button
- A demo login button on `/login` for quick testing access — requires
  signing up once with the fixed demo credentials noted in
  `app/login/page.tsx`; it's a real account like any other, not an auth
  bypass. Grant it admin too (see `supabase/make-me-admin.sql`) if you
  want the Admin link to show up when presenting via that button

## What's different from Amazon, on purpose
- No sponsored listings or upsell modules anywhere in the cart/checkout flow
- Checkout is one page and one screen, not a multi-step wizard
- Card numbers and CVCs are never persisted, anywhere, even server-side

## Deliberate trade-offs (worth mentioning in a walkthrough)
- **Checkout requires sign-in.** Real per-user order history needs a real
  identity; the old localStorage version's "guest checkout" was only ever
  pseudo-guest (tied to one browser) anyway.
- **Order status (Placed → Processing → Shipped → Delivered) is real but
  manually advanced** by an admin from `/admin/orders` — there's no real
  courier or warehouse system behind it, by design (see above).
- **Country/dial-code list covers ~120 common countries**, not the full
  ISO set of ~195.
- **Account deletion removes your data but not always instantly your auth
  session on other devices** — standard behavior, not a bug.

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase
(Postgres, Auth, Storage).

## Supabase setup (do this once)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **SQL Editor → New query**, paste the
   entire contents of `supabase/schema.sql` from this repo, and run it.
   This creates all tables (including `products` and `reviews`), Row Level
   Security policies, the auto-profile-on-signup trigger, and the `avatars`
   storage bucket.
3. Run `supabase/seed-products.sql` once (new query, paste, run) to load the
   product catalog with starting stock numbers. Safe to re-run — it won't
   duplicate products, though re-running does reset stock back to the seed
   numbers, which is handy if you want to reset the demo. No reviews are
   seeded on purpose: reviews are real and user-submitted now, so the first
   ones you see will be ones you (or a tester) actually write through the
   product page.
4. **Make yourself an admin** (optional, needed only for `/admin/orders`):
   sign up in the app first, then run `supabase/make-me-admin.sql` with your
   email swapped in. Without this, order status stays stuck at "Placed"
   forever, since nothing else can advance it.
5. **Turn off "Confirm email"** for this demo: Authentication → Providers
   → Email → toggle "Confirm email" off. Without this, new signups won't
   be able to sign in until they click an email link — fine for
   production, unnecessary friction for a judged demo.
6. **Add your reset-password redirect URL**: Authentication → URL
   Configuration → Redirect URLs, add `http://localhost:3000/reset-password`
   for local dev and `https://your-deployed-url/reset-password` once
   deployed. Without this, "Forgot password" emails will send but the
   link will be rejected.
7. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this one secret)
8. Copy `.env.local.example` to `.env.local` and fill in those three values.
9. **Optional — real emails**: sign up at [resend.com](https://resend.com),
   grab an API key, and add `RESEND_API_KEY` and `NOTIFICATIONS_FROM_EMAIL`
   to `.env.local` too (see the comments in `.env.local.example` — there's
   an important limitation on the free sandbox sender you'll want to read).
   Without this, the app works exactly the same, it just silently skips
   sending emails.

## Local development
```bash
npm install
npm run dev
```

## Deploy (Vercel)
1. Push this repo to GitHub.
2. Import it on Vercel.
3. Add the same three environment variables from `.env.local` in Vercel's
   Project Settings → Environment Variables (mark `SUPABASE_SERVICE_ROLE_KEY`
   as a server-only/secret variable — never expose it with a `NEXT_PUBLIC_`
   prefix).
4. Deploy.

## Testing

```bash
npm test
```

Runs the automated unit and integration tests (no Supabase project needed).
See `TESTING.md` for what's covered, plus a manual security/RLS/edge-case
checklist to run against a real Supabase project before deploying — that
part genuinely can't be automated without live credentials, so it's a
checklist, not a test file.

## Agent logs
Prompts/responses from the AI coding agent used to build this are committed
under `.agent-logs/` per the 8x agent-capture-setup requirement.
