-- Run once in Supabase -> SQL Editor to enable the admin drag-and-drop order.
alter table public.portfolio_items
  add column if not exists sort_order integer;

update public.portfolio_items
set sort_order = row_number
from (
  select id, row_number() over (partition by category order by created_at desc) - 1 as row_number
  from public.portfolio_items
) ordered
where public.portfolio_items.id = ordered.id
  and public.portfolio_items.sort_order is null;
