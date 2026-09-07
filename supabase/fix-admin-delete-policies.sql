-- Run once in Supabase -> SQL Editor if deleting products shows "Access denied".
drop policy if exists "Admin can delete portfolio" on public.portfolio_items;
create policy "Admin can delete portfolio"
on public.portfolio_items for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admin can delete portfolio images" on public.portfolio_images;
create policy "Admin can delete portfolio images"
on public.portfolio_images for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admin can delete herbz images" on storage.objects;
create policy "Admin can delete herbz images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'herbz-images'
  and exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
