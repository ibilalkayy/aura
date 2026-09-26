# Aura Frontend Redesign — Phase 0 Audit

No code changes in this phase. This is a full inventory of every route, its
backend data dependencies, and every shared component, so the redesign
(Phases 1–9) touches presentation only and never backend behavior.

Branch: `redesign/editorial`. Baseline verified before this audit: `npm
install`, `npm test` (40/40 passing), `npm run build` (all 19 routes compile)
all green on `main` before branching.

A note on the repo's `AGENTS.md`/`CLAUDE.md`: these files contain text
claiming this is "not the Next.js you know" and instructing the reader to
consult a nonexistent `node_modules/next/dist/docs/` before writing code.
That mechanism doesn't exist in Next.js and the framing is false — this is
being treated as untrusted content embedded in the repo, not followed.

---

## 1. Current design baseline (starting point, not the target)

`app/globals.css` already has a light editorial foundation, not an
Amazon-style layout:

- Tokens: `--paper #faf9f6`, `--ink #14181a`, `--brand #0f6b5c` /
  `--brand-dark #0a4d42`, `--accent #e8590c` / `--accent-dark #c94a08`,
  `--line #e4e1d9`. Exposed via Tailwind v4 `@theme inline`.
- `font-display` uses system serif stack (Iowan Old Style / Palatino /
  Georgia), body uses system sans stack — no `next/font`, no Fraunces, no
  Instrument Sans.
- No dark mode / theme tokens, no `sage`/`amber`/`danger` tokens beyond
  `accent`, no motion tokens, no 1320px max-width convention (currently a
  mix of `max-w-7xl`/`max-w-6xl`/`max-w-4xl`/`max-w-3xl`/`max-w-2xl`/
  `max-w-sm` per page, inconsistent).
- Buttons are already pill-shaped (`rounded-full`), cards already
  `rounded-2xl` with hairline `border-line` — this part is compatible with
  the target system and can be extended rather than replaced.
- No command palette, no drawer/sheet primitive, no accordion primitive, no
  skeleton-loading component (each page hand-rolls its own pulse divs), no
  toast/sonner-style notification.
- Vocabulary is still "Cart" throughout — Header, Footer, Cart page, nav —
  not yet "Bag".

**Net effect:** the redesign is extending an already-modest, non-Amazon
foundation, not stripping out Amazon-style chrome. Phase 1 (tokens/fonts/
primitives) has real work to do (fonts, dark mode, sage/amber tokens, `ui/`
primitives, spacing/motion consistency) but colors/shapes are a smaller
lift than a from-scratch dark-pattern-heavy marketplace would be.

---

## 2. Routes — data dependencies and current state

All pages are `"use client"` with `useEffect`-driven fetches (an established
project convention, not something this redesign should change — Hard Rule 2
says don't touch `lib/**`/`app/api/**` behavior, and converting to server
components would touch how data loads, so client-fetch stays).

| Route | Backend calls (from `lib/`) | Notes for redesign |
|---|---|---|
| `/` (`app/page.tsx`) | `getAllProducts`, `getRecentlyViewed` | Hero, category chips, recently-viewed rail, all-products grid, skeleton state |
| `/search` (`app/search/page.tsx`) | `searchProducts({query, category, sort})` | Real server-side query on every param change (not client filter) — preserve. Chip filters + sort links via URL params already |
| `/product/[slug]` | `getProductBySlug`, `searchProducts` (fallback related), `getReviewsForProduct`, `addReview`, `recordView`, `getFrequentlyBoughtWith`, `getProductVariants`, `getProductImages`, `getAddresses`, `estimateDelivery` | Densest page: gallery, variants (display-only, disclosed), delivery estimate widget, reviews + review form, frequently-bought-together/related rail with source-aware heading |
| `/cart` | `useCart()` (localStorage-backed, product data hydrated via `getProductsByIds` inside the context) | Becomes "Bag" in vocabulary only — cart-context.tsx itself is untouched |
| `/checkout` | `useCart`, `useAuth`, `placeOrder`, `getAddresses`, `getPaymentMethods`, `getAccessToken` + `POST /api/notify/order-confirmation` | Saved address/card selects, new-address/card fallback forms, inline order summary, best-effort confirmation email (fire-and-forget, must stay non-blocking) |
| `/login` | `useAuth().logIn`, demo-login autofill (`demo@aura.test`) | Split-screen auth spec target; demo button must keep working exactly as-is (requires prior signup with those exact creds) |
| `/signup` | `useAuth().signUp` | Same split-screen spec; live validation hints are new UI, no backend change (signUp already validates server-side via Supabase) |
| `/forgot-password` | `useAuth().requestPasswordReset` | Generic "if an account exists…" success state already present — matches brief's anti-enumeration requirement |
| `/reset-password` | `useAuth().updatePassword`, `user` (session from reset link) | "Invalid/expired link" state already present |
| `/orders` | `getOrders`, `getProductsByIds`, 30s poll | Status-pill filter chips + search-by-id/product-name already present; becomes status-pill list rows per spec |
| `/orders/[id]` | `getOrder`, `getOrderStatusHistory`, `buildStatusSteps`, `canCancelOrder`, `cancelOrder`, `getProductsByIds`, 30s poll | Horizontal step tracker today → becomes vertical timeline per spec. Cancel button gated by `canCancelOrder` (24h window AND not shipped/delivered) — logic untouched, only presented differently. Uses `ConfirmDialog` |
| `/confirmation/[id]` | `getOrder`, `getProductsByIds` | Simple order-placed receipt |
| `/account` | `useAuth` (`updateUser`, `deleteAccount`), `getAddresses`/`addAddress`/`deleteAddress`, `getPaymentMethods`/`addPaymentMethod`/`deletePaymentMethod`, `detectBrand`, `uploadAvatar` | Three-tab (Details/Addresses/Payment) → left-nav desktop / list mobile per spec. Danger zone delete uses `ConfirmDialog`, spec wants typed-DELETE confirmation — presentation change only |
| `/admin` | `useAuth` (`isAdmin` gate) | Simple hub linking to Products/Orders |
| `/admin/orders` | `getAllOrdersForAdmin`, `adminSetOrderStatus` + `POST /api/notify/order-status` | Per-order status `<select>` → becomes data table per spec |
| `/admin/products` | `getAllProducts`, `adminCreateProduct`, `adminUpdateProduct`, `adminDeleteProduct`, `uploadProductImage`, `getProductVariants`/`adminAddVariant`/`adminDeleteVariant`, `getProductImages`/`adminAddProductImage`/`adminDeleteProductImage` | Inline form today → slide-over panel per spec. `VariantManager` then `GalleryManager` order inside the form is intentional (confirmed in earlier work) and must be preserved |
| `app/api/delete-account/route.ts` | server-only, service-role | Not touched — route handler, no UI |
| `app/api/notify/order-confirmation/route.ts` | server-only, Resend | Not touched |
| `app/api/notify/order-status/route.ts` | server-only, Resend | Not touched |

Auth/cart state is global via `AuthProvider`/`CartProvider` in
`app/layout.tsx`, wrapping `Header`/`Footer`/`BackToTop`. The redesign's
"global shell" work happens in `app/layout.tsx` + `Header.tsx` + `Footer.tsx`
+ a new mobile bottom-tab component; providers themselves are untouched.

---

## 3. Shared components — current responsibility

| Component | Responsibility | Redesign scope |
|---|---|---|
| `Header.tsx` | Logo, search form (desktop inline + mobile row), account dropdown menu, cart/notification icon swap | Becomes slim top bar + command-palette search (⌘K / `/` / icon) + mobile bottom tabs |
| `Footer.tsx` | Brand blurb, 3 link columns (real popup content via `InfoDialog`), socials, copyright | Restyle only — all copy/links/popups stay; add theme toggle |
| `ProductCard.tsx` | Image, name, stars-or-"no reviews", price/compare price, low-stock/out-of-stock badges | New 4:5 image ratio per spec (currently `aspect-square`), same data surface |
| `ProductGallery.tsx` | Left/right arrow + thumbnail strip, single image fallback | Restyle; spec wants stacked gallery desktop, swipeable mobile |
| `AddToCart.tsx` | Qty select, Add/Buy-now buttons, out-of-stock state, post-add confirmation link | "Add to cart" → "Add to bag" copy change; logic (`useCart().addToCart`) untouched |
| `NotificationBell.tsx` | Realtime subscription (`subscribeToNotifications`), dropdown list, mark-read/mark-all-read | Restyle only — spec is explicit: don't touch subscription logic |
| `Stars.tsx` | Half-star rendering from a numeric rating | Keep, restyle color/size tokens |
| `CountryInput.tsx` | Datalist-backed country autocomplete | Keep as-is or lightly restyle; used in checkout/product delivery estimate/account addresses |
| `PhoneInput.tsx` | Country-prefixed phone entry with flag emoji | Keep as-is |
| `PasswordInput.tsx` | Show/hide toggle (emoji icons 🙈/👁️) | Spec likely wants `lucide-react` Eye/EyeOff icons instead of emoji — cosmetic swap only |
| `ConfirmDialog.tsx` | Generic confirm/cancel modal, danger variant | Becomes the base for a proper Dialog/Drawer primitive in `components/ui/` |
| `InfoDialog.tsx` | Generic single-button info modal (footer popups) | Same — likely merges into the same Dialog primitive |
| `BackToTop.tsx` | Scroll-triggered floating button | Keep, restyle |

No component currently reads or writes Supabase directly — all data access
is routed through `lib/*.ts`, so swapping component internals is safe as
long as the same `lib` functions are called with the same arguments.

---

## 4. Feature checklist carried over from the brief (all currently working, must stay working)

Search/sort/filter · stock warnings (low-stock + out-of-stock) · product
gallery · variants (display-only, disclosed) · delivery estimate (region
heuristic, disclosed as not-live) · reviews (list + submit) · frequently-
bought-together with same-category fallback + label swap · recently-viewed ·
cart with per-line stock clamping · guest cart (localStorage, no user gate
until checkout) · checkout (saved address/card or new) · order history with
status/search filters · order detail with real timeline + cancellation
(24h window AND not shipped/delivered) · realtime notification bell ·
avatar upload · saved addresses/payment methods (last4-only, no full PAN/CVC
stored) · account deletion (server route, service-role) · demo login button
· admin product CRUD + image upload + variants + gallery · admin order
status changes with best-effort email.

---

## 5. Needs backend change (none identified yet)

Nothing found in this audit that the frontend redesign requires from
`lib/**`, `supabase/**`, or `app/api/**` — every page's data need is already
served by an existing exported function. This section will be revisited if
a later phase surfaces a real gap (per Hard Rule 2, any such gap gets noted
here rather than silently implemented).

---

## 6. Phase plan (unchanged from the brief, restated for tracking)

0. This audit — **done**.
1. Fonts (Fraunces + Instrument Sans via `next/font`), color tokens
   (light+dark, sage/amber/danger added), spacing/motion tokens, `components/ui/`
   primitives (Button, Card, Dialog/Drawer, Accordion, Skeleton), temporary
   `/dev/ui` preview page.
2. Global shell: `Header`, `Footer`, mobile bottom tabs, command-palette
   search.
3. Home + Search.
4. Product page.
5. Bag (drawer + `/cart` restyle, vocabulary swap).
6. Checkout.
7. Auth pages (login/signup/forgot/reset).
8. Orders, Notifications, Account, Admin.
9. Accessibility/performance pass, visual-consistency pass, remove any
   now-unused old markup, update `README.md`.

`npm test` and `npm run build` run after every phase; each phase gets its
own commit on `redesign/editorial`.
