-- Run once in Supabase -> SQL Editor to store customer, address and product snapshots.
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists status text not null default 'new';

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
    update public.orders
    set customer_email = p_customer_email,
        customer_name = p_customer_name,
        shipping_address = p_shipping_address,
        items = p_items
    where stripe_event_id = p_event_id;
    return false;
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    update public.portfolio_items
    set stock_quantity = stock_quantity - (item->>'quantity')::integer
    where id = (item->>'id')::uuid
      and category = 'shop'
      and stock_quantity >= (item->>'quantity')::integer;
    if not found then raise exception 'Insufficient stock for item %', item->>'id'; end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) from public, anon, authenticated;
grant execute on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) to service_role;
