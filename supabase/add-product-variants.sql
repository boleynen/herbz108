-- Allow one shop item to offer several customer-selectable formats.
alter table public.portfolio_items
  add column if not exists variants jsonb not null default '[]'::jsonb;

comment on column public.portfolio_items.variants is
  'Optional purchasable variants. Each entry contains id, label, size, price_cents and prodigi_sku.';
