update public.products
set brand = replace(brand, 'Astra', 'Weyra')
where brand like '%Astra%';

update public.product_offers
set merchant = replace(merchant, 'ASTRA', 'WEYRA')
where merchant like '%ASTRA%';
