-- Run once in Supabase -> SQL Editor after deploying the new shop categories.
-- Existing prints become open editions by default; change an individual item in /admin
-- to "Prints limited edition" if you want to limit its quantity.
alter table public.portfolio_items drop constraint if exists portfolio_items_product_type_check;

update public.portfolio_items
set product_type = case product_type
  when 'paintings' then 'art-canvas'
  when 'prints' then 'prints-open-edition'
  when 'sculptures' then 'objects-deco'
  else product_type
end
where category = 'shop';

alter table public.portfolio_items
add constraint portfolio_items_product_type_check
check (product_type is null or product_type in (
  'prints-limited-edition',
  'prints-open-edition',
  'art-paper',
  'art-wood',
  'art-canvas',
  'apparel',
  'objects-deco',
  'other'
));
