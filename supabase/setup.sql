-- Run this once in Supabase -> SQL Editor.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('tattoo', 'art', 'shop')),
  title text not null,
  description text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 50),
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.portfolio_items enable row level security;

create policy "Admin can read own allowlist entry" on public.admin_users
for select to authenticated using (user_id=(select auth.uid()));

create policy "Public can read portfolio" on public.portfolio_items
for select to anon, authenticated using (true);

create policy "Admin can add portfolio" on public.portfolio_items
for insert to authenticated with check (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

create policy "Admin can update portfolio" on public.portfolio_items
for update to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
) with check (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

create policy "Admin can delete portfolio" on public.portfolio_items
for delete to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('herbz-images', 'herbz-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true, file_size_limit=10485760,
allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "Admin can upload herbz images" on storage.objects
for insert to authenticated with check (
  bucket_id='herbz-images' and
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

create policy "Admin can update herbz images" on storage.objects
for update to authenticated using (
  bucket_id='herbz-images' and
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

create policy "Admin can delete herbz images" on storage.objects
for delete to authenticated using (
  bucket_id='herbz-images' and
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

-- After creating your user in Authentication -> Users, run this separately:
-- insert into public.admin_users(user_id) values('YOUR-USER-UUID');
