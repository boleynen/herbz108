-- Run once in Supabase SQL Editor.
-- Hidden items remain in the database and can be shown again from the admin area.
alter table public.portfolio_items
  add column if not exists is_hidden boolean not null default false;

create index if not exists portfolio_items_is_hidden_idx
  on public.portfolio_items (is_hidden);
