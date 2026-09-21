-- Run once in Supabase SQL Editor before publishing giftcards.
alter table public.portfolio_items
  drop constraint if exists portfolio_items_fulfillment_mode_check;

alter table public.portfolio_items
  add constraint portfolio_items_fulfillment_mode_check
  check (fulfillment_mode in ('stock', 'prodigi', 'giftcard'));

comment on column public.portfolio_items.fulfillment_mode is
  'stock, prodigi, or giftcard';
