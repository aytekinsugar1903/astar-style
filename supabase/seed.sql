-- Reproducible, synthetic catalog data. No third-party scraping or copied imagery.
begin;
create temporary table astra_demo_seed (
 external_id text, name text, brand text, category text, colors text[], metadata jsonb,
 price numeric, currency text, in_stock boolean
) on commit drop;
insert into astra_demo_seed values
('p1','Saten Midi Elbise','Demo Atelier','Elbise',ARRAY['Bordo']::text[],'{"style_tags":["Klasik","Romantik"],"audience":"women"}'::jsonb,2499,'TRY',true),
('p2','Dökümlü Siyah Elbise','Demo Studio','Elbise',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Zamansız"],"audience":"women"}'::jsonb,1890,'TRY',true),
('p3','Krem Kesim Blazer','Demo Form','Ceket',ARRAY['Krem']::text[],'{"style_tags":["Ofis","Klasik"],"audience":"women"}'::jsonb,2790,'TRY',true),
('p4','İnce Topuklu Ayakkabı','Demo Line','Ayakkabı',ARRAY['Siyah']::text[],'{"style_tags":["Klasik"],"audience":"women"}'::jsonb,1299,'TRY',false),
('p5','Lacivert Kruvaze Elbise','Nova Edit','Elbise',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"women"}'::jsonb,2190,'TRY',true),
('p6','Pastel Şifon Elbise','Luna Form','Elbise',ARRAY['Pastel']::text[],'{"style_tags":["Romantik"],"audience":"women"}'::jsonb,2390,'TRY',true),
('p7','Toprak Keten Elbise','Terra Line','Elbise',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Zamansız"],"audience":"women"}'::jsonb,1690,'TRY',true),
('p8','Kırmızı Statement Elbise','Weyra Edit','Elbise',ARRAY['Kırmızı']::text[],'{"style_tags":["Cesur","Romantik"],"audience":"women"}'::jsonb,3290,'TRY',true),
('p9','Siyah Kısa Ceket','Mode Lab','Ceket',ARRAY['Siyah']::text[],'{"style_tags":["Sokak","Minimal"],"audience":"women"}'::jsonb,1990,'TRY',true),
('p10','Lacivert Ofis Blazer','Forma','Ceket',ARRAY['Lacivert']::text[],'{"style_tags":["Ofis","Klasik"],"audience":"women"}'::jsonb,3190,'TRY',true),
('p11','Toprak Süet Görünümlü Ceket','Terra Line','Ceket',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Sokak"],"audience":"women"}'::jsonb,2890,'TRY',true),
('p12','Pastel Hafif Ceket','Luna Form','Ceket',ARRAY['Pastel']::text[],'{"style_tags":["Romantik","Rahat"],"audience":"women"}'::jsonb,1790,'TRY',false),
('p13','Krem Babet','Soft Step','Ayakkabı',ARRAY['Krem']::text[],'{"style_tags":["Romantik","Klasik"],"audience":"women"}'::jsonb,1099,'TRY',true),
('p14','Bordo Loafer','Urban Sole','Ayakkabı',ARRAY['Bordo']::text[],'{"style_tags":["Ofis","Zamansız"],"audience":"women"}'::jsonb,1599,'TRY',true),
('p15','Beyaz Minimal Sneaker','Move','Ayakkabı',ARRAY['Beyaz']::text[],'{"style_tags":["Rahat","Minimal"],"audience":"women"}'::jsonb,1499,'TRY',true),
('p16','Toprak Sandalet','Solea','Ayakkabı',ARRAY['Toprak']::text[],'{"style_tags":["Rahat"],"audience":"women"}'::jsonb,899,'TRY',true),
('p17','Lacivert Topuklu Ayakkabı','Demo Line','Ayakkabı',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Romantik"],"audience":"women"}'::jsonb,1799,'TRY',true),
('p18','Siyah Yüksek Bel Pantolon','Forma','Pantolon',ARRAY['Siyah']::text[],'{"style_tags":["Ofis","Minimal"],"audience":"women"}'::jsonb,1390,'TRY',true),
('p19','Krem Palazzo Pantolon','Flow Studio','Pantolon',ARRAY['Krem']::text[],'{"style_tags":["Rahat","Klasik"],"audience":"women"}'::jsonb,1590,'TRY',true),
('p20','Lacivert Düz Kesim Pantolon','Nova Edit','Pantolon',ARRAY['Lacivert']::text[],'{"style_tags":["Ofis","Zamansız"],"audience":"women"}'::jsonb,1790,'TRY',true),
('p21','Toprak Kargo Pantolon','Urban Form','Pantolon',ARRAY['Toprak']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"women"}'::jsonb,1490,'TRY',true),
('p22','Pastel Geniş Paça Pantolon','Luna Form','Pantolon',ARRAY['Pastel']::text[],'{"style_tags":["Romantik","Rahat"],"audience":"women"}'::jsonb,1690,'TRY',false),
('p23','Siyah Midi Etek','Demo Studio','Etek',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Klasik"],"audience":"women"}'::jsonb,1190,'TRY',true),
('p24','Bordo Pilili Etek','Weyra Edit','Etek',ARRAY['Bordo']::text[],'{"style_tags":["Romantik","Klasik"],"audience":"women"}'::jsonb,1390,'TRY',true),
('p25','Krem Saten Etek','Flow Studio','Etek',ARRAY['Krem']::text[],'{"style_tags":["Romantik","Zamansız"],"audience":"women"}'::jsonb,1490,'TRY',true),
('p26','Mavi Denim Etek','Urban Form','Etek',ARRAY['Mavi']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"women"}'::jsonb,1090,'TRY',true),
('p27','Beyaz Poplin Gömlek','Forma','Gömlek',ARRAY['Beyaz']::text[],'{"style_tags":["Ofis","Zamansız"],"audience":"women"}'::jsonb,990,'TRY',true),
('p28','Krem İpek Dokulu Gömlek','Soft Form','Gömlek',ARRAY['Krem']::text[],'{"style_tags":["Klasik","Romantik"],"audience":"women"}'::jsonb,1690,'TRY',true),
('p29','Lacivert Oversize Gömlek','Move','Gömlek',ARRAY['Lacivert']::text[],'{"style_tags":["Rahat","Minimal"],"audience":"women"}'::jsonb,1290,'TRY',true),
('p30','Pastel Fular Yaka Bluz','Luna Form','Gömlek',ARRAY['Pastel']::text[],'{"style_tags":["Romantik","Ofis"],"audience":"women"}'::jsonb,1490,'TRY',true),
('p31','Yeşil Keten Gömlek','Terra Line','Gömlek',ARRAY['Yeşil']::text[],'{"style_tags":["Rahat"],"audience":"women"}'::jsonb,1190,'TRY',false),
('p32','Siyah Premium Tişört','Core Edit','Tişört',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Rahat"],"audience":"women"}'::jsonb,699,'TRY',true),
('p33','Beyaz Bisiklet Yaka Tişört','Core Edit','Tişört',ARRAY['Beyaz']::text[],'{"style_tags":["Zamansız","Rahat"],"audience":"women"}'::jsonb,599,'TRY',true),
('p34','Bordo Fitilli Üst','Mode Lab','Tişört',ARRAY['Bordo']::text[],'{"style_tags":["Sokak","Minimal"],"audience":"women"}'::jsonb,799,'TRY',true),
('p35','Siyah Yapılı Omuz Çantası','Weyra Edit','Çanta',ARRAY['Siyah']::text[],'{"style_tags":["Klasik","Zamansız"],"audience":"unisex"}'::jsonb,1890,'TRY',true),
('p36','Krem Mini Çanta','Soft Form','Çanta',ARRAY['Krem']::text[],'{"style_tags":["Romantik","Minimal"],"audience":"unisex"}'::jsonb,1390,'TRY',true),
('p37','Toprak Büyük Tote Çanta','Terra Line','Çanta',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Ofis"],"audience":"unisex"}'::jsonb,1690,'TRY',true),
('p38','Altın Tonlu Halka Küpe','Demo Jewel','Aksesuar',ARRAY['Toprak']::text[],'{"style_tags":["Klasik","Cesur"],"audience":"unisex"}'::jsonb,499,'TRY',true),
('p39','Bordo İnce Kemer','Forma','Aksesuar',ARRAY['Bordo']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"unisex"}'::jsonb,599,'TRY',true),
('p40','Pastel İpek Dokulu Fular','Luna Form','Aksesuar',ARRAY['Pastel']::text[],'{"style_tags":["Romantik","Zamansız"],"audience":"unisex"}'::jsonb,749,'TRY',true),
('p41','Lacivert Yapılı Blazer','North Form','Ceket',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"men"}'::jsonb,3290,'TRY',true),
('p42','Siyah Bomber Ceket','Urban North','Ceket',ARRAY['Siyah']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"men"}'::jsonb,2390,'TRY',true),
('p43','Toprak Süet Ceket','Terra Men','Ceket',ARRAY['Toprak']::text[],'{"style_tags":["Zamansız","Rahat"],"audience":"men"}'::jsonb,3690,'TRY',true),
('p44','Krem Hafif Ceket','Core Men','Ceket',ARRAY['Krem']::text[],'{"style_tags":["Minimal","Rahat"],"audience":"men"}'::jsonb,2190,'TRY',true),
('p45','Bordo Kadife Ceket','Noir Edit','Ceket',ARRAY['Bordo']::text[],'{"style_tags":["Cesur","Klasik"],"audience":"men"}'::jsonb,3990,'TRY',false),
('p46','Siyah Slim Pantolon','North Form','Pantolon',ARRAY['Siyah']::text[],'{"style_tags":["Ofis","Minimal"],"audience":"men"}'::jsonb,1590,'TRY',true),
('p47','Lacivert Chino Pantolon','Core Men','Pantolon',ARRAY['Lacivert']::text[],'{"style_tags":["Rahat","Zamansız"],"audience":"men"}'::jsonb,1490,'TRY',true),
('p48','Toprak Kargo Pantolon Erkek','Urban North','Pantolon',ARRAY['Toprak']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"men"}'::jsonb,1690,'TRY',true),
('p49','Krem Bol Kesim Pantolon','Move Men','Pantolon',ARRAY['Krem']::text[],'{"style_tags":["Rahat","Minimal"],"audience":"men"}'::jsonb,1790,'TRY',true),
('p50','Gri Klasik Pantolon','Forma Men','Pantolon',ARRAY['Gri']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"men"}'::jsonb,1890,'TRY',true),
('p51','Beyaz Oxford Gömlek','North Form','Gömlek',ARRAY['Beyaz']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"men"}'::jsonb,1290,'TRY',true),
('p52','Mavi Keten Gömlek Erkek','Coast Men','Gömlek',ARRAY['Mavi']::text[],'{"style_tags":["Rahat","Zamansız"],"audience":"men"}'::jsonb,1390,'TRY',true),
('p53','Siyah Minimal Gömlek','Noir Edit','Gömlek',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Cesur"],"audience":"men"}'::jsonb,1490,'TRY',true),
('p54','Toprak Overshirt','Terra Men','Gömlek',ARRAY['Toprak']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"men"}'::jsonb,1790,'TRY',true),
('p55','Bordo Çizgili Gömlek','Forma Men','Gömlek',ARRAY['Bordo']::text[],'{"style_tags":["Klasik"],"audience":"men"}'::jsonb,1590,'TRY',false),
('p56','Siyah Ağır Pamuk Tişört','Core Men','Tişört',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Rahat"],"audience":"unisex"}'::jsonb,799,'TRY',true),
('p57','Beyaz Premium Tişört Erkek','Core Men','Tişört',ARRAY['Beyaz']::text[],'{"style_tags":["Zamansız","Rahat"],"audience":"unisex"}'::jsonb,749,'TRY',true),
('p58','Lacivert Polo Yaka','North Form','Tişört',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Rahat"],"audience":"unisex"}'::jsonb,1190,'TRY',true),
('p59','Yeşil Dokulu Tişört','Move Men','Tişört',ARRAY['Yeşil']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"unisex"}'::jsonb,899,'TRY',true),
('p60','Krem Oversize Tişört','Urban North','Tişört',ARRAY['Krem']::text[],'{"style_tags":["Sokak","Minimal"],"audience":"unisex"}'::jsonb,849,'TRY',true),
('p61','Siyah Deri Sneaker','North Sole','Ayakkabı',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Zamansız"],"audience":"unisex"}'::jsonb,2190,'TRY',true),
('p62','Kahverengi Deri Loafer','North Sole','Ayakkabı',ARRAY['Toprak']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"unisex"}'::jsonb,2490,'TRY',true),
('p63','Beyaz Günlük Sneaker','Move','Ayakkabı',ARRAY['Beyaz']::text[],'{"style_tags":["Rahat","Sokak"],"audience":"unisex"}'::jsonb,1690,'TRY',true),
('p64','Lacivert Süet Ayakkabı','Forma Men','Ayakkabı',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik"],"audience":"unisex"}'::jsonb,2290,'TRY',true),
('p65','Toprak Sandalet Erkek','Coast Men','Ayakkabı',ARRAY['Toprak']::text[],'{"style_tags":["Rahat"],"audience":"unisex"}'::jsonb,1190,'TRY',false),
('p66','Krem İnce Triko','Core Men','Kazak',ARRAY['Krem']::text[],'{"style_tags":["Minimal","Zamansız"],"audience":"men"}'::jsonb,1490,'TRY',true),
('p67','Lacivert Boğazlı Kazak','North Form','Kazak',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Minimal"],"audience":"men"}'::jsonb,1690,'TRY',true),
('p68','Toprak Dokulu Kazak','Terra Men','Kazak',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Zamansız"],"audience":"men"}'::jsonb,1590,'TRY',true),
('p69','Siyah Fermuarlı Hırka','Urban North','Kazak',ARRAY['Siyah']::text[],'{"style_tags":["Sokak","Rahat"],"audience":"men"}'::jsonb,1790,'TRY',true),
('p70','Bordo Bisiklet Yaka Kazak','Noir Edit','Kazak',ARRAY['Bordo']::text[],'{"style_tags":["Klasik","Cesur"],"audience":"men"}'::jsonb,1690,'TRY',true),
('p71','Lacivert İki Parça Takım','North Form','Takım',ARRAY['Lacivert']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"men"}'::jsonb,4990,'TRY',true),
('p72','Siyah Modern Takım','Noir Edit','Takım',ARRAY['Siyah']::text[],'{"style_tags":["Minimal","Klasik"],"audience":"men"}'::jsonb,5290,'TRY',true),
('p73','Toprak Keten Takım','Coast Men','Takım',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Klasik"],"audience":"men"}'::jsonb,4590,'TRY',true),
('p74','Krem Yazlık Takım','Forma Men','Takım',ARRAY['Krem']::text[],'{"style_tags":["Cesur","Klasik"],"audience":"men"}'::jsonb,4790,'TRY',false),
('p75','Siyah Deri Evrak Çantası','North Carry','Çanta',ARRAY['Siyah']::text[],'{"style_tags":["Ofis","Zamansız"],"audience":"unisex"}'::jsonb,2690,'TRY',true),
('p76','Toprak Kanvas Tote','Terra Carry','Çanta',ARRAY['Toprak']::text[],'{"style_tags":["Rahat","Sokak"],"audience":"unisex"}'::jsonb,1190,'TRY',true),
('p77','Lacivert Minimal Sırt Çantası','Move','Çanta',ARRAY['Lacivert']::text[],'{"style_tags":["Minimal","Rahat"],"audience":"unisex"}'::jsonb,1890,'TRY',true),
('p78','Siyah Deri Kemer','North Form','Aksesuar',ARRAY['Siyah']::text[],'{"style_tags":["Klasik","Zamansız"],"audience":"unisex"}'::jsonb,799,'TRY',true),
('p79','Bordo Örgü Kravat','Forma Men','Aksesuar',ARRAY['Bordo']::text[],'{"style_tags":["Klasik","Ofis"],"audience":"unisex"}'::jsonb,699,'TRY',true),
('p80','Toprak Minimal Saat Kayışı','Core Men','Aksesuar',ARRAY['Toprak']::text[],'{"style_tags":["Minimal","Rahat"],"audience":"unisex"}'::jsonb,599,'TRY',true);
insert into public.products(source,external_id,name,brand,category,colors,image_url,product_url,metadata,active,updated_at)
select 'demo',external_id,name,brand,category,colors,null,'https://example.com',metadata,true,now()
from astra_demo_seed
on conflict(source,external_id) do update set name=excluded.name,brand=excluded.brand,category=excluded.category,colors=excluded.colors,metadata=excluded.metadata,active=true,updated_at=now();
update public.product_offers o set merchant='WEYRA Demo',price=s.price,currency=s.currency,in_stock=s.in_stock,affiliate_url=null,commission_rate=null,updated_at=now()
from astra_demo_seed s join public.products p on p.source='demo' and p.external_id=s.external_id
where o.product_id=p.id;
insert into public.product_offers(product_id,merchant,price,currency,in_stock,affiliate_url,commission_rate,updated_at)
select p.id,'WEYRA Demo',s.price,s.currency,s.in_stock,null,null,now()
from astra_demo_seed s join public.products p on p.source='demo' and p.external_id=s.external_id
where not exists(select 1 from public.product_offers o where o.product_id=p.id);
commit;

