alter table public.style_profiles
  add column if not exists avatar_config jsonb not null default '{}'::jsonb;

alter table public.wardrobe_items
  add column if not exists raw_image_path text,
  add column if not exists cutout_image_path text,
  add column if not exists processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded','segmenting','enriching','ready','needs_review','failed')),
  add column if not exists capture_quality jsonb not null default '{}'::jsonb,
  add column if not exists matched_metadata jsonb not null default '{}'::jsonb,
  add column if not exists brand text,
  add column if not exists fabric text,
  add column if not exists purchase_price numeric(12,2) check (purchase_price is null or purchase_price >= 0),
  add column if not exists purchase_currency char(3) not null default 'TRY',
  add column if not exists wear_count integer not null default 0 check (wear_count >= 0),
  add column if not exists last_worn_at timestamptz,
  add column if not exists metadata_confirmed boolean not null default false;

update public.wardrobe_items set raw_image_path = image_path where raw_image_path is null;
alter table public.wardrobe_items alter column raw_image_path set not null;
create index if not exists wardrobe_items_user_worn_idx
  on public.wardrobe_items(user_id, last_worn_at desc nulls last);

alter table public.outfits
  add column if not exists context jsonb not null default '{}'::jsonb;

create table if not exists public.dressing_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  canvas_state jsonb not null default '{"items":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.dressing_sessions enable row level security;
create policy dressing_sessions_owner_all on public.dressing_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.wear_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  event_name text,
  worn_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists wear_events_user_date_idx on public.wear_events(user_id, worn_on desc);
alter table public.wear_events enable row level security;
create policy wear_events_owner_all on public.wear_events for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.wear_event_items (
  wear_event_id uuid not null references public.wear_events(id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  primary key (wear_event_id, wardrobe_item_id)
);
alter table public.wear_event_items enable row level security;
create policy wear_event_items_owner_all on public.wear_event_items for all to authenticated
  using (exists (
    select 1 from public.wear_events e
    where e.id = wear_event_id and e.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.wear_events e
    where e.id = wear_event_id and e.user_id = (select auth.uid())
  ));

create or replace function public.mark_outfit_worn(p_outfit_id uuid, p_event_name text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id uuid;
begin
  if v_user_id is null or not exists (
    select 1 from public.outfits where id = p_outfit_id and user_id = v_user_id
  ) then
    raise exception 'OUTFIT_NOT_FOUND';
  end if;

  insert into public.wear_events(user_id, outfit_id, event_name)
  values (v_user_id, p_outfit_id, nullif(left(trim(p_event_name), 100), ''))
  returning id into v_event_id;

  insert into public.wear_event_items(wear_event_id, wardrobe_item_id)
  select v_event_id, oi.wardrobe_item_id
  from public.outfit_items oi
  join public.wardrobe_items wi on wi.id = oi.wardrobe_item_id and wi.user_id = v_user_id
  where oi.outfit_id = p_outfit_id;

  update public.wardrobe_items wi
  set wear_count = wear_count + 1, last_worn_at = now()
  where wi.user_id = v_user_id
    and exists (
      select 1 from public.outfit_items oi
      where oi.outfit_id = p_outfit_id and oi.wardrobe_item_id = wi.id
    );

  return v_event_id;
end;
$$;
revoke all on function public.mark_outfit_worn(uuid, text) from public, anon;
grant execute on function public.mark_outfit_worn(uuid, text) to authenticated;
