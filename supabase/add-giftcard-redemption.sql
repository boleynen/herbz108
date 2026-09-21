-- Run once in Supabase SQL Editor.
create or replace function public.redeem_gift_card(p_code text, p_amount_cents integer)
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
  used := least(card.balance_cents, greatest(0, p_amount_cents));
  update gift_cards set balance_cents = balance_cents - used, status = case when balance_cents - used = 0 then 'depleted' else status end where id = card.id;
  return jsonb_build_object('code', card.code, 'discount_cents', used, 'remaining_cents', card.balance_cents - used);
end;
$$;
