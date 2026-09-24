-- Run once in the Supabase SQL Editor.
-- Prevents duplicate internal order notifications when Stripe retries a webhook.
alter table public.orders
  add column if not exists merchant_notification_sent_at timestamptz,
  add column if not exists merchant_notification_email_id text;
