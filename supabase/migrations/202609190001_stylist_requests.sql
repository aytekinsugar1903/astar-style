create table public.stylist_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_text text not null check (length(request_text) between 1 and 1000),
  outfit_item_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','answered','closed')),
  stylist_reply text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index stylist_requests_user_date_idx on public.stylist_requests(user_id, created_at desc);
create index stylist_requests_pending_idx on public.stylist_requests(created_at) where status = 'pending';
alter table public.stylist_requests enable row level security;
create policy stylist_requests_owner_read on public.stylist_requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy stylist_requests_owner_submit on public.stylist_requests
  for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending' and stylist_reply is null);
revoke all on public.stylist_requests from anon, authenticated;
grant select, insert on public.stylist_requests to authenticated;
grant all on public.stylist_requests to service_role;
