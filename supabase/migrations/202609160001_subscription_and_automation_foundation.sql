create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'mock',
  provider_customer_id text,
  provider_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','premium')),
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','canceled')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_active_period_idx
on public.subscriptions(current_period_end)
where status in ('trialing','active');

alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
grant select on public.subscriptions to authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null check (job_name in ('daily_health','weekly_insights')),
  status text not null check (status in ('running','succeeded','failed')),
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists automation_runs_job_started_idx
on public.automation_runs(job_name, started_at desc);

alter table public.automation_runs enable row level security;
revoke all on public.automation_runs from anon, authenticated;

