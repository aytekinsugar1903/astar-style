create index if not exists analytics_events_name_created_idx
on public.analytics_events (event_name, created_at desc);

create or replace function public.admin_analytics_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
  current_active as (
    select distinct user_id
    from public.analytics_events
    where user_id is not null
      and created_at >= pg_catalog.now() - interval '7 days'
  ),
  previous_active as (
    select distinct user_id
    from public.analytics_events
    where user_id is not null
      and created_at >= pg_catalog.now() - interval '14 days'
      and created_at < pg_catalog.now() - interval '7 days'
  ),
  event_stats as (
    select
      count(distinct user_id) filter (
        where created_at >= pg_catalog.now() - interval '1 day'
      ) as dau,
      count(distinct user_id) filter (
        where created_at >= pg_catalog.now() - interval '30 days'
      ) as mau,
      count(*) filter (
        where event_name = 'screen_view'
          and created_at >= pg_catalog.now() - interval '30 days'
      ) as screen_views_30d,
      count(*) filter (
        where event_name = 'product_click'
          and created_at >= pg_catalog.now() - interval '30 days'
      ) as product_clicks_30d,
      count(*) filter (
        where event_name = 'product_saved'
          and created_at >= pg_catalog.now() - interval '30 days'
      ) as product_saves_30d,
      count(*) filter (
        where event_name = 'client_error'
          and created_at >= pg_catalog.now() - interval '1 day'
      ) as client_errors_24h,
      coalesce(avg(
        case
          when event_name = 'session_end'
            and properties ->> 'duration_seconds' ~ '^[0-9]+([.][0-9]+)?$'
          then (properties ->> 'duration_seconds')::numeric
        end
      ) filter (
        where created_at >= pg_catalog.now() - interval '30 days'
      ), 0) as avg_session_seconds_30d
    from public.analytics_events
  ),
  retention as (
    select
      case when count(*) = 0 then 0
        else round(
          100.0 * count(*) filter (where ca.user_id is not null) / count(*),
          1
        )
      end as retention_7d_pct
    from previous_active pa
    left join current_active ca using (user_id)
  )
  select pg_catalog.jsonb_build_object(
    'dau', es.dau,
    'mau', es.mau,
    'retention7dPct', r.retention_7d_pct,
    'avgSessionSeconds30d', round(es.avg_session_seconds_30d, 1),
    'screenViews30d', es.screen_views_30d,
    'productClicks30d', es.product_clicks_30d,
    'productSaves30d', es.product_saves_30d,
    'clientErrors24h', es.client_errors_24h
  )
  from event_stats es
  cross join retention r;
$$;

revoke all on function public.admin_analytics_snapshot() from public;
revoke all on function public.admin_analytics_snapshot() from anon;
revoke all on function public.admin_analytics_snapshot() from authenticated;
grant execute on function public.admin_analytics_snapshot() to service_role;

comment on function public.admin_analytics_snapshot()
is 'Aggregates privacy-minimized product analytics for the service-role admin dashboard.';
