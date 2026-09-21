-- Run once in Supabase SQL Editor.
create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  initial_amount_cents integer not null check (initial_amount_cents > 0),
  balance_cents integer not null check (balance_cents >= 0),
  expires_at date not null,
  status text not null default 'active' check (status in ('active','blocked','expired','depleted')),
  purchaser_email text,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
create policy "Admins can manage gift cards" on public.gift_cards
  for all to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
