-- Aura — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query).
-- Safe to re-run: uses "create table if not exists" and "drop policy if exists" throughout.

-- ============================================================
-- 1. profiles — one row per user, extends auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
-- first_name/last_name come from the signUp() call's `options.data`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. addresses
-- ============================================================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  full_name text not null,
  street text not null,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "addresses are managed by owner" on public.addresses;
create policy "addresses are managed by owner"
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. payment_methods — never store full card number or CVC
-- ============================================================
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_holder text not null,
  brand text not null,
  last4 text not null,
  expiry text not null,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

drop policy if exists "payment methods are managed by owner" on public.payment_methods;
create policy "payment methods are managed by owner"
  on public.payment_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. orders + order_items
-- ============================================================
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  placed_at timestamptz not null default now(),
  name text not null,
  address text not null,
  total numeric not null,
  cancelled boolean not null default false,
  cancelled_at timestamptz
);

alter table public.orders enable row level security;

drop policy if exists "orders are managed by owner" on public.orders;
create policy "orders are managed by owner"
  on public.orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  price numeric not null,
  quantity int not null
);

alter table public.order_items enable row level security;

drop policy if exists "order items are managed by order owner" on public.order_items;
create policy "order items are managed by order owner"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. avatars storage bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users can upload their own avatar" on storage.objects;
create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users can update their own avatar" on storage.objects;
create policy "users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- 6. products — the catalog, publicly readable, edited via SQL/seed for now
-- ============================================================
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  price numeric not null,
  compare_at_price numeric,
  image text not null,
  description text not null,
  highlights text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products are publicly readable" on public.products;
create policy "products are publicly readable"
  on public.products for select
  using (true);

-- ============================================================
-- 7. reviews — real, user-submitted, tied to a real account
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews are publicly readable" on public.reviews;
create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

drop policy if exists "users can insert their own reviews" on public.reviews;
create policy "users can insert their own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own reviews" on public.reviews;
create policy "users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 8. stock — added to products, changed only through the two
--    functions below (never a direct client UPDATE), so a purchase
--    can't oversell and a cancellation correctly restores stock.
-- ============================================================
alter table public.products add column if not exists stock int not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_nonnegative'
  ) then
    alter table public.products
      add constraint products_stock_nonnegative check (stock >= 0);
  end if;
end $$;

-- Atomically decrements stock only if enough is available. Returns false
-- (without changing anything) if there isn't enough — callers must check
-- the return value before treating a purchase as reserved.
create or replace function public.decrement_product_stock(p_id text, qty int)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  affected int;
begin
  update public.products
  set stock = stock - qty
  where id = p_id and stock >= qty;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function public.decrement_product_stock(text, int) to authenticated;

-- Restores stock, used when an order is cancelled.
create or replace function public.increment_product_stock(p_id text, qty int)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products set stock = stock + qty where id = p_id;
end;
$$;

grant execute on function public.increment_product_stock(text, int) to authenticated;

-- ============================================================
-- 9. recently_viewed — powers a real "recently viewed" rail,
--    one row per (user, product), timestamp bumped on re-view
-- ============================================================
create table if not exists public.recently_viewed (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.recently_viewed enable row level security;

drop policy if exists "recently viewed is managed by owner" on public.recently_viewed;
create policy "recently viewed is managed by owner"
  on public.recently_viewed for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 10. Admin flag + real, admin-driven order status (replaces the
--     old time-simulated status entirely)
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.orders add column if not exists status text not null default 'placed';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_valid') then
    alter table public.orders
      add constraint orders_status_valid
      check (status in ('placed', 'processing', 'shipped', 'delivered'));
  end if;
end $$;

-- Admins need to see every order to manage them, not just their own.
drop policy if exists "admins can view all orders" on public.orders;
create policy "admins can view all orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "admins can view all order items" on public.order_items;
create policy "admins can view all order items"
  on public.order_items for select
  using (public.is_admin());

-- One row per status change, so the tracker can show a real date for each
-- stage actually reached, instead of an estimate computed from elapsed time.
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  status text not null check (status in ('placed', 'processing', 'shipped', 'delivered')),
  changed_at timestamptz not null default now()
);

alter table public.order_status_history enable row level security;

drop policy if exists "status history viewable by order owner or admin" on public.order_status_history;
create policy "status history viewable by order owner or admin"
  on public.order_status_history for select
  using (
    public.is_admin() or exists (
      select 1 from public.orders
      where orders.id = order_status_history.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Logs "placed" automatically the moment an order is created.
create or replace function public.log_initial_order_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.order_status_history (order_id, status, changed_at)
  values (new.id, 'placed', new.placed_at);
  return new;
end;
$$;

drop trigger if exists on_order_created on public.orders;
create trigger on_order_created
  after insert on public.orders
  for each row execute function public.log_initial_order_status();

-- The only way an order's status can move forward. Checks admin status
-- itself (defense in depth beyond the authenticated-only grant), and
-- updates orders.status and order_status_history together so they can
-- never drift out of sync.
create or replace function public.admin_set_order_status(p_order_id text, p_status text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    return false;
  end if;
  update public.orders set status = p_status where id = p_order_id;
  insert into public.order_status_history (order_id, status) values (p_order_id, p_status);
  return true;
end;
$$;

grant execute on function public.admin_set_order_status(text, text) to authenticated;

-- ============================================================
-- 11. Admin catalog management — only admins can create, edit,
--     or delete products. Everyone can still read them (policy
--     from section 6 already covers select).
-- ============================================================
drop policy if exists "admins can insert products" on public.products;
create policy "admins can insert products"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "admins can update products" on public.products;
create policy "admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete products" on public.products;
create policy "admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- ============================================================
-- 12. product-images storage bucket — public read, admin-only write
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admins can upload product images" on storage.objects;
create policy "admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins can update product images" on storage.objects;
create policy "admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins can delete product images" on storage.objects;
create policy "admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================
-- 13. notifications — in-app mirror of order confirmation/status
--     emails. Only ever inserted server-side (service role, from the
--     /api/notify/* routes) — there is deliberately no client insert
--     policy, so a notification can never be spoofed by a user.
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications viewable by owner" on public.notifications;
create policy "notifications viewable by owner"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications updatable by owner" on public.notifications;
create policy "notifications updatable by owner"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ============================================================
-- 14. product_variants — real, admin-managed options (e.g. Color:
--     Red, Size: M). Selection on the product page is currently
--     display-only — see README for the honest scope note on this.
-- ============================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  option_type text not null,
  option_value text not null,
  created_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

drop policy if exists "product variants are publicly readable" on public.product_variants;
create policy "product variants are publicly readable"
  on public.product_variants for select
  using (true);

drop policy if exists "admins can manage product variants" on public.product_variants;
create policy "admins can manage product variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 15. product_images — a real photo gallery per product, beyond
--     the single cover image on the products table itself.
-- ============================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

drop policy if exists "product image rows are publicly readable" on public.product_images;
create policy "product image rows are publicly readable"
  on public.product_images for select
  using (true);

drop policy if exists "admins can manage product image rows" on public.product_images;
create policy "admins can manage product image rows"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());
