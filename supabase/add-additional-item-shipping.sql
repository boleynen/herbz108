-- Run once in Supabase SQL Editor.
-- Existing products keep their current per-item shipping price as the fallback
-- additional-item price until you edit them in Admin.
alter table public.portfolio_items
  add column if not exists additional_shipping_prices jsonb not null default '{}'::jsonb;

update public.portfolio_items
set additional_shipping_prices = custom_shipping_prices
where category = 'shop'
  and additional_shipping_prices = '{}'::jsonb;
