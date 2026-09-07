-- Run this once in Supabase -> SQL Editor for an existing HERBZ108 database.
alter table public.portfolio_items
add column if not exists product_type text,
add column if not exists canvas_type text;

alter table public.portfolio_items
drop constraint if exists portfolio_items_product_type_check;

alter table public.portfolio_items
add constraint portfolio_items_product_type_check
check (product_type is null or product_type in ('paintings', 'prints', 'apparel', 'sculptures', 'other'));

-- Existing shop products remain visible under the Other filter.
update public.portfolio_items
set product_type = 'other'
where category = 'shop' and product_type is null;
