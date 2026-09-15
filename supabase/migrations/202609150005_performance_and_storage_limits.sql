create index if not exists affiliate_clicks_offer_idx
  on public.affiliate_clicks(offer_id);

create index if not exists affiliate_clicks_user_created_idx
  on public.affiliate_clicks(user_id, created_at desc);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events(user_id, created_at desc);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events(user_id, created_at desc);

create index if not exists favorites_product_idx
  on public.favorites(product_id);

update storage.buckets
set
  file_size_limit = 12582912,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif']
where id = 'user-photos';

update storage.buckets
set
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'try-on-results';
