-- Run once in Supabase -> SQL Editor to enable multiple product images.
create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.portfolio_items(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_images enable row level security;

drop policy if exists "Public can read portfolio images" on public.portfolio_images;
create policy "Public can read portfolio images" on public.portfolio_images
for select to anon, authenticated using (true);

drop policy if exists "Admin can add portfolio images" on public.portfolio_images;
create policy "Admin can add portfolio images" on public.portfolio_images
for insert to authenticated with check (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

drop policy if exists "Admin can delete portfolio images" on public.portfolio_images;
create policy "Admin can delete portfolio images" on public.portfolio_images
for delete to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

-- Register current single images so existing products also use the gallery.
insert into public.portfolio_images(item_id, image_url, storage_path, is_cover, sort_order)
select id, image_url, storage_path, true, 0
from public.portfolio_items item
where not exists (select 1 from public.portfolio_images image where image.item_id = item.id);
