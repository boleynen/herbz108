-- Run once in Supabase SQL Editor.
create table if not exists public.gift_card_redemptions (gift_card_id uuid not null references public.gift_cards(id) on delete cascade, stripe_event_id text not null, amount_cents integer not null check (amount_cents > 0), created_at timestamptz not null default now(), primary key (gift_card_id, stripe_event_id));

create or replace function public.redeem_gift_card(p_code text, p_amount_cents integer, p_event_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare card gift_cards%rowtype; used integer;
begin
  select * into card from gift_cards where upper(code)=upper(trim(p_code)) for update;
  if not found or card.status <> 'active' or card.expires_at < current_date then
    raise exception 'Giftcard is invalid or expired';
  end if;
  if exists (select 1 from gift_card_redemptions where gift_card_id = card.id and stripe_event_id = p_event_id) then
    return jsonb_build_object('code', card.code, 'discount_cents', 0, 'remaining_cents', card.balance_cents);
  end if;
  used := least(card.balance_cents, greatest(0, p_amount_cents));
  if used <= 0 then raise exception 'Giftcard has no remaining balance'; end if;
  update gift_cards set balance_cents = balance_cents - used, status = case when balance_cents - used = 0 then 'depleted' else status end where id = card.id;
  insert into gift_card_redemptions (gift_card_id, stripe_event_id, amount_cents) values (card.id, p_event_id, used);
  return jsonb_build_object('code', card.code, 'discount_cents', used, 'remaining_cents', card.balance_cents - used);
end;
$$;

revoke all on function public.redeem_gift_card(text, integer, text) from public, anon, authenticated;
grant execute on function public.redeem_gift_card(text, integer, text) to service_role;
