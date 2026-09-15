create table public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('profile','full_body')),
  image_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index user_photos_user_kind_idx on public.user_photos(user_id, kind, created_at desc);
create unique index user_photos_one_primary_per_kind_idx
  on public.user_photos(user_id, kind) where is_primary;

alter table public.user_photos enable row level security;

create policy user_photos_owner_select on public.user_photos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy user_photos_owner_insert on public.user_photos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy user_photos_owner_update on public.user_photos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy user_photos_owner_delete on public.user_photos for delete to authenticated
  using ((select auth.uid()) = user_id);
