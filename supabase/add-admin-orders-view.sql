-- Run once in Supabase -> SQL Editor so authenticated admins can view orders.
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
