-- Zero-cost, clearly labeled catalog records for testing favorites and affiliate-click flows.
-- These are not scraped products and must be replaced by an official API/feed before launch.
insert into public.products
  (id, source, external_id, name, brand, category, colors, product_url, active, metadata)
values
  ('11111111-1111-4111-8111-111111111111','demo','p1','Saten Midi Elbise','Demo Atelier','Elbise',array['Bordo'],'https://example.com',true,'{"style_tags":["Klasik","Romantik"],"demo":true}'::jsonb),
  ('11111111-1111-4111-8111-111111111112','demo','p2','Dökümlü Siyah Elbise','Demo Studio','Elbise',array['Siyah'],'https://example.com',true,'{"style_tags":["Minimal","Zamansız"],"demo":true}'::jsonb),
  ('11111111-1111-4111-8111-111111111113','demo','p3','Krem Kesim Blazer','Demo Form','Ceket',array['Krem'],'https://example.com',true,'{"style_tags":["Ofis","Klasik"],"demo":true}'::jsonb),
  ('11111111-1111-4111-8111-111111111114','demo','p4','İnce Topuklu Ayakkabı','Demo Line','Ayakkabı',array['Siyah'],'https://example.com',true,'{"style_tags":["Klasik"],"demo":true}'::jsonb)
on conflict (source, external_id) do update set
  name=excluded.name, brand=excluded.brand, category=excluded.category,
  colors=excluded.colors, product_url=excluded.product_url, active=excluded.active,
  metadata=excluded.metadata, updated_at=now();

insert into public.product_offers
  (id, product_id, merchant, price, currency, in_stock, affiliate_url, commission_rate)
values
  ('21111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','Demo Mağaza',2499,'TRY',true,null,null),
  ('21111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111112','Demo Mağaza',1890,'TRY',true,null,null),
  ('21111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111113','Demo Mağaza',2790,'TRY',true,null,null),
  ('21111111-1111-4111-8111-111111111114','11111111-1111-4111-8111-111111111114','Demo Mağaza',1299,'TRY',false,null,null)
on conflict (id) do update set
  price=excluded.price, currency=excluded.currency, in_stock=excluded.in_stock,
  affiliate_url=excluded.affiliate_url, commission_rate=excluded.commission_rate,
  updated_at=now();

