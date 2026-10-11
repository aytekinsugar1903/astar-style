create extension if not exists pgcrypto;

create type public.wardrobe_category as enum (
  'dress','trousers','skirt','shirt','tshirt','jacket','shoes','bag','accessory','other'
);
create type public.job_status as enum ('queued','processing','succeeded','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'tr' check (locale in ('tr','en')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);
create index consents_user_created_idx on public.consents(user_id, created_at desc);

create table public.style_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  body_preferences jsonb not null default '{}'::jsonb,
  preferred_colors text[] not null default '{}',
  avoided_colors text[] not null default '{}',
  style_tags text[] not null default '{}',
  sizes jsonb not null default '{}'::jsonb,
  ai_summary text,
  updated_at timestamptz not null default now()
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  category public.wardrobe_category not null default 'other',
  image_path text not null,
  colors text[] not null default '{}',
  style_tags text[] not null default '{}',
  seasons text[] not null default '{}',
  ai_confidence numeric(4,3) check (ai_confidence between 0 and 1),
  created_at timestamptz not null default now()
);
create index wardrobe_items_user_category_idx on public.wardrobe_items(user_id, category, created_at desc);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  occasion text,
  explanation text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);
create index outfits_user_created_idx on public.outfits(user_id, created_at desc);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  primary key (outfit_id, wardrobe_item_id)
);

create table public.try_on_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status public.job_status not null default 'queued',
  person_image_path text not null,
  garment_image_path text not null,
  result_image_path text,
  estimated_cost_usd numeric(10,6) not null default 0,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index try_on_jobs_user_created_idx on public.try_on_jobs(user_id, created_at desc);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  name text not null,
  brand text,
  category text not null,
  colors text[] not null default '{}',
  image_url text,
  product_url text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);
create index products_search_idx on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(category,'')));

create table public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  merchant text not null,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null,
  in_stock boolean,
  affiliate_url text,
  commission_rate numeric(6,4),
  updated_at timestamptz not null default now()
);
create index product_offers_product_price_idx on public.product_offers(product_id, price);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  offer_id uuid references public.product_offers(id) on delete set null,
  created_at timestamptz not null default now()
);
create index affiliate_clicks_product_created_idx on public.affiliate_clicks(product_id, created_at desc);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  operation text not null,
  provider text not null,
  model text,
  success boolean not null,
  latency_ms integer check (latency_ms >= 0),
  estimated_cost_usd numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_created_idx on public.ai_usage_events(created_at desc);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);
create index analytics_event_created_idx on public.analytics_events(event_name, created_at desc);

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.style_profiles enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.try_on_jobs enable row level security;
alter table public.products enable row level security;
alter table public.product_offers enable row level security;
alter table public.favorites enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.analytics_events enable row level security;

create policy profiles_owner_all on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy consents_owner_all on public.consents for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy style_profiles_owner_all on public.style_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy wardrobe_owner_all on public.wardrobe_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy outfits_owner_all on public.outfits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy outfit_items_owner_all on public.outfit_items for all to authenticated
  using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())))
  with check (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())));
create policy try_on_owner_all on public.try_on_jobs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy products_read on public.products for select to anon, authenticated using (active);
create policy offers_read on public.product_offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy favorites_owner_all on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy affiliate_click_insert on public.affiliate_clicks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy affiliate_click_read on public.affiliate_clicks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy ai_usage_read on public.ai_usage_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy analytics_insert_authenticated on public.analytics_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy analytics_read_owner on public.analytics_events for select to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', false), ('try-on-results', 'try-on-results', false)
on conflict (id) do nothing;

create policy user_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy user_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy user_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy user_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy try_on_results_select on storage.objects for select to authenticated
  using (bucket_id = 'try-on-results' and (storage.foldername(name))[1] = (select auth.uid())::text);

