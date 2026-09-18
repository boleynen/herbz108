-- Run once in Supabase -> SQL Editor before enabling Prodigi POD products.
alter table public.portfolio_items add column if not exists fulfillment_mode text not null default 'stock';
alter table public.portfolio_items add column if not exists fulfillment_provider text;
alter table public.portfolio_items add column if not exists prodigi_sku text;
alter table public.portfolio_items add column if not exists prodigi_asset_url text;
alter table public.portfolio_items add column if not exists prodigi_attributes jsonb not null default '{}'::jsonb;
alter table public.portfolio_items add column if not exists prodigi_sizing text not null default 'fillPrintArea';

alter table public.portfolio_items drop constraint if exists portfolio_items_fulfillment_mode_check;
alter table public.portfolio_items add constraint portfolio_items_fulfillment_mode_check check (fulfillment_mode in ('stock', 'prodigi'));
alter table public.portfolio_items drop constraint if exists portfolio_items_prodigi_sizing_check;
alter table public.portfolio_items add constraint portfolio_items_prodigi_sizing_check check (prodigi_sizing in ('fillPrintArea', 'fitPrintArea', 'stretchToPrintArea'));

alter table public.orders add column if not exists prodigi_order_id text unique;
alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;
alter table public.orders add column if not exists confirmation_email_id text;
alter table public.orders add column if not exists prodigi_status text;
alter table public.orders add column if not exists prodigi_tracking_number text;
alter table public.orders add column if not exists prodigi_tracking_url text;
alter table public.orders add column if not exists prodigi_last_error text;
alter table public.orders add column if not exists prodigi_updated_at timestamptz;
alter table public.orders add column if not exists prodigi_tracking_email_sent_at timestamptz;

create or replace function public.process_paid_order(
  p_event_id text,
  p_session_id text,
  p_items jsonb,
  p_customer_email text,
  p_customer_name text,
  p_shipping_address jsonb,
  p_amount_total integer,
  p_currency text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  inserted_id uuid;
begin
  insert into public.orders(stripe_event_id, stripe_session_id, customer_email, customer_name, shipping_address, amount_total, currency, items)
  values(p_event_id, p_session_id, p_customer_email, p_customer_name, p_shipping_address, p_amount_total, p_currency, p_items)
  on conflict(stripe_event_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    update public.orders set customer_email = p_customer_email, customer_name = p_customer_name, shipping_address = p_shipping_address, items = p_items where stripe_event_id = p_event_id;
    return false;
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    if coalesce(item->>'fulfillment_mode', 'stock') = 'stock' then
      update public.portfolio_items
      set stock_quantity = stock_quantity - (item->>'quantity')::integer
      where id = (item->>'id')::uuid and category = 'shop' and stock_quantity >= (item->>'quantity')::integer;
      if not found then raise exception 'Insufficient stock for item %', item->>'id'; end if;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) from public, anon, authenticated;
grant execute on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) to service_role;
