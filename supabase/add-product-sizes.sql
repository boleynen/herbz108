-- Run once in Supabase -> SQL Editor to enable dimensions and apparel stock per size.
alter table public.portfolio_items add column if not exists size text;
alter table public.portfolio_items add column if not exists size_stock jsonb not null default '{}'::jsonb;

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
  requested_size text;
  requested_quantity integer;
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
    requested_quantity := (item->>'quantity')::integer;
    requested_size := nullif(item->>'size', '');

    if requested_size is not null then
      update public.portfolio_items
      set size_stock = jsonb_set(size_stock, array[requested_size], to_jsonb((size_stock->>requested_size)::integer - requested_quantity)),
          stock_quantity = stock_quantity - requested_quantity
      where id = (item->>'id')::uuid
        and category = 'shop'
        and product_type = 'apparel'
        and coalesce((size_stock->>requested_size)::integer, 0) >= requested_quantity
        and stock_quantity >= requested_quantity;
    else
      update public.portfolio_items
      set stock_quantity = stock_quantity - requested_quantity
      where id = (item->>'id')::uuid
        and category = 'shop'
        and product_type <> 'apparel'
        and stock_quantity >= requested_quantity;
    end if;

    if not found then raise exception 'Insufficient stock for item %', item->>'id'; end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) from public, anon, authenticated;
grant execute on function public.process_paid_order(text,text,jsonb,text,text,jsonb,integer,text) to service_role;
