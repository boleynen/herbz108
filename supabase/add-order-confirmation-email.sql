-- Run once in Supabase -> SQL Editor before enabling confirmation emails.
alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;
alter table public.orders add column if not exists confirmation_email_id text;
