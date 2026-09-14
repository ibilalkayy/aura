-- Aura — product catalog seed
-- Run once, after schema.sql, in the Supabase SQL Editor.
-- Safe to re-run: on conflict it just resets stock back to these numbers
-- (handy for demo purposes) without duplicating or touching other fields.
--
-- Note: no reviews are seeded here on purpose. Reviews are now real and
-- user-submitted (tied to a real signed-in account via reviews.user_id),
-- so every review that shows up going forward is one someone actually wrote
-- through the app, not fake seed data pretending to be real feedback.
--
-- Stock numbers are a deliberate mix so every UI state is demoable:
-- plenty in stock, a couple of "only N left" low-stock items, and one
-- sold-out item (the desk lamp).

insert into public.products (id, slug, name, category, price, compare_at_price, image, description, highlights, stock)
values
  ('1', 'wireless-noise-cancelling-headphones', 'AuraSound Wireless Noise-Cancelling Headphones', 'Electronics', 89.99, 129.99, 'https://picsum.photos/seed/headphones/600/600',
   'Over-ear wireless headphones with active noise cancellation, 40-hour battery life, and a fold-flat design for travel.',
   array['Active noise cancellation with transparency mode', '40 hours of playback on a single charge', 'Bluetooth 5.3, USB-C fast charging', 'Memory-foam ear cushions'], 42),

  ('2', 'mechanical-keyboard', 'Keystone 75% Mechanical Keyboard', 'Electronics', 64.50, null, 'https://picsum.photos/seed/keyboard/600/600',
   'Hot-swappable mechanical keyboard with a compact 75% layout, per-key RGB, and a braided USB-C cable.',
   array['Hot-swappable switches', '75% layout, dedicated arrow keys', 'PBT keycaps', 'USB-C, 1.5m braided cable'], 15),

  ('3', 'stainless-steel-cookware-set', 'Hearth 10-Piece Stainless Steel Cookware Set', 'Home & Kitchen', 149.00, 210.00, 'https://picsum.photos/seed/cookware/600/600',
   'Tri-ply stainless steel cookware set — pots, pans, and lids that go from stovetop to oven, dishwasher safe.',
   array['Tri-ply full-body construction', 'Oven safe to 500°F', 'Dishwasher safe', 'Induction compatible'], 8),

  ('4', 'electric-kettle', 'Kettlewell Rapid-Boil Electric Kettle, 1.7L', 'Home & Kitchen', 34.99, null, 'https://picsum.photos/seed/kettle/600/600',
   '1.7L electric kettle with rapid boil, auto shut-off, and a concealed heating element.',
   array['Boils in under 5 minutes', 'Auto shut-off + boil-dry protection', '1.7L capacity', '360° cordless base'], 27),

  ('5', 'mens-button-down-shirt', 'Fieldstone Men''s Cotton Button-Down Shirt', 'Fashion', 38.00, null, 'https://picsum.photos/seed/shirt-men/600/600',
   'Classic-fit cotton button-down, breathable weave, machine washable.',
   array['100% cotton', 'Classic fit', 'Machine wash', 'Available in 6 colors'], 33),

  ('6', 'womens-running-shoes', 'Stridewell Women''s Running Shoes', 'Sports & Outdoors', 72.00, 95.00, 'https://picsum.photos/seed/running-shoes/600/600',
   'Lightweight running shoes with responsive foam cushioning and a breathable knit upper.',
   array['Responsive foam midsole', 'Breathable knit upper', 'Reflective details', '6mm heel-to-toe drop'], 4),

  ('7', 'yoga-mat', 'Groundwork Non-Slip Yoga Mat, 6mm', 'Sports & Outdoors', 24.99, null, 'https://picsum.photos/seed/yoga-mat/600/600',
   'Extra-thick 6mm yoga mat with a non-slip textured surface, includes carry strap.',
   array['6mm thickness', 'Non-slip texture both sides', 'Includes carry strap', 'Free of latex and phthalates'], 60),

  ('8', 'atomic-habits-inspired-planner', 'Focuswell Daily Planner & Habit Tracker', 'Books', 18.50, null, 'https://picsum.photos/seed/planner/600/600',
   'Undated daily planner with habit-tracking grids, goal-setting pages, and a durable hardcover.',
   array['Undated — start anytime', '12-month habit tracker', 'Hardcover, lay-flat binding', 'A5 size'], 51),

  ('9', 'vitamin-c-serum', 'Lumen Vitamin C Brightening Serum', 'Beauty', 21.99, 29.99, 'https://picsum.photos/seed/serum/600/600',
   '20% Vitamin C serum with hyaluronic acid, formulated for daily brightening.',
   array['20% Vitamin C + E', 'Hyaluronic acid for hydration', 'Fragrance-free', '1oz / 30ml'], 19),

  ('10', 'smart-led-desk-lamp', 'Beacon Smart LED Desk Lamp', 'Electronics', 42.00, null, 'https://picsum.photos/seed/desk-lamp/600/600',
   'Touch-control LED desk lamp with adjustable color temperature and a USB charging port.',
   array['5 color temperatures, stepless dimming', 'Built-in USB-A charging port', 'Touch controls', 'Memory function'], 0),

  ('11', 'cast-iron-skillet', 'Hearth Pre-Seasoned Cast Iron Skillet, 12in', 'Home & Kitchen', 29.99, null, 'https://picsum.photos/seed/skillet/600/600',
   'Pre-seasoned 12-inch cast iron skillet, oven and campfire safe, builds a better nonstick surface over time.',
   array['Pre-seasoned, ready to use', 'Oven, stovetop, and campfire safe', '12-inch diameter', 'Lifetime durability'], 22),

  ('12', 'womens-denim-jacket', 'Rivergate Women''s Classic Denim Jacket', 'Fashion', 46.00, null, 'https://picsum.photos/seed/denim-jacket/600/600',
   'Classic-fit denim jacket with button front and chest pockets, a wardrobe staple.',
   array['100% cotton denim', 'Button front', 'Chest pockets', 'Machine washable'], 2)

on conflict (id) do update set stock = excluded.stock;
