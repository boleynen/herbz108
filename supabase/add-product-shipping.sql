-- Run once in Supabase -> SQL Editor before deploying the shipping calculator.
alter table public.portfolio_items add column if not exists shipping_weight_grams integer;
alter table public.portfolio_items add column if not exists shipping_width_cm numeric;
alter table public.portfolio_items add column if not exists shipping_height_cm numeric;
alter table public.portfolio_items add column if not exists shipping_depth_cm numeric;
alter table public.portfolio_items add column if not exists shipping_mode text not null default 'automatic';
alter table public.portfolio_items add column if not exists custom_shipping_prices jsonb not null default '{}'::jsonb;

alter table public.portfolio_items drop constraint if exists portfolio_items_shipping_weight_check;
alter table public.portfolio_items add constraint portfolio_items_shipping_weight_check check (shipping_weight_grams is null or shipping_weight_grams > 0);
alter table public.portfolio_items drop constraint if exists portfolio_items_shipping_mode_check;
alter table public.portfolio_items add constraint portfolio_items_shipping_mode_check check (shipping_mode in ('automatic', 'custom'));
