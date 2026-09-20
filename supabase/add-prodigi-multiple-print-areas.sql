-- Run once in Supabase -> SQL Editor before publishing a T-shirt with front/back artwork.
-- Keeps the existing prodigi_asset_url column for older POD products.
alter table public.portfolio_items
  add column if not exists prodigi_assets jsonb not null default '[]'::jsonb;

comment on column public.portfolio_items.prodigi_assets is
  'Prodigi production files, e.g. [{"printArea":"center_chest","url":"..."},{"printArea":"center_back","url":"..."}]';
