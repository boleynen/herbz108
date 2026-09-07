-- Run once in Supabase -> SQL Editor before enabling Stripe payments.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  stripe_session_id text not null unique,
  customer_email text,
  amount_total integer not null,
  currency text not null,
  items jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "admins can view orders" on public.orders;
create policy "admins can view orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

create or replace function public.process_paid_order(
  p_event_id text,
  p_session_id text,
  p_items jsonb,
  p_customer_email text,
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
  insert into public.orders(stripe_event_id, stripe_session_id, customer_email, amount_total, currency, items)
  values(p_event_id, p_session_id, p_customer_email, p_amount_total, p_currency, p_items)
  on conflict(stripe_event_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then return false; end if;

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

revoke all on function public.process_paid_order(text,text,jsonb,text,integer,text) from public, anon, authenticated;
grant execute on function public.process_paid_order(text,text,jsonb,text,integer,text) to service_role;
