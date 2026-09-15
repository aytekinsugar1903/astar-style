create or replace function public.reserve_ai_usage(
  p_user_id uuid,
  p_operation text,
  p_provider text,
  p_model text default null,
  p_estimated_cost_usd numeric default 0,
  p_window_seconds integer default 3600,
  p_max_requests integer default 20,
  p_daily_cost_limit_usd numeric default 1
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_count integer;
  v_daily_cost numeric;
  v_event_id uuid;
  v_retry_after integer;
begin
  if p_user_id is null
    or nullif(btrim(p_operation), '') is null
    or nullif(btrim(p_provider), '') is null
    or p_estimated_cost_usd < 0
    or p_window_seconds < 1
    or p_max_requests < 1
    or p_daily_cost_limit_usd < 0 then
    raise exception 'INVALID_USAGE_LIMIT_ARGUMENT';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_operation, 0)
  );

  select count(*)::integer
    into v_request_count
  from public.ai_usage_events
  where user_id = p_user_id
    and operation = p_operation
    and success
    and created_at >= pg_catalog.now() - pg_catalog.make_interval(secs => p_window_seconds);

  if v_request_count >= p_max_requests then
    insert into public.ai_usage_events (
      user_id, operation, provider, model, success, latency_ms, estimated_cost_usd
    ) values (
      p_user_id, p_operation || '_rate_limited', p_provider, p_model, false, 0, 0
    );

    return pg_catalog.jsonb_build_object(
      'allowed', false,
      'reason', 'RATE_LIMITED',
      'retry_after_seconds', p_window_seconds,
      'remaining', 0
    );
  end if;

  select coalesce(sum(estimated_cost_usd), 0)
    into v_daily_cost
  from public.ai_usage_events
  where user_id = p_user_id
    and success
    and created_at >= pg_catalog.date_trunc('day', pg_catalog.now());

  if v_daily_cost + p_estimated_cost_usd > p_daily_cost_limit_usd then
    v_retry_after := greatest(
      1,
      extract(epoch from (
        pg_catalog.date_trunc('day', pg_catalog.now()) + interval '1 day' - pg_catalog.now()
      ))::integer
    );

    insert into public.ai_usage_events (
      user_id, operation, provider, model, success, latency_ms, estimated_cost_usd
    ) values (
      p_user_id, p_operation || '_cost_limited', p_provider, p_model, false, 0, 0
    );

    return pg_catalog.jsonb_build_object(
      'allowed', false,
      'reason', 'DAILY_COST_LIMIT',
      'retry_after_seconds', v_retry_after,
      'remaining', greatest(0, p_max_requests - v_request_count)
    );
  end if;

  insert into public.ai_usage_events (
    user_id, operation, provider, model, success, estimated_cost_usd
  ) values (
    p_user_id, p_operation, p_provider, p_model, true, p_estimated_cost_usd
  )
  returning id into v_event_id;

  return pg_catalog.jsonb_build_object(
    'allowed', true,
    'event_id', v_event_id,
    'remaining', greatest(0, p_max_requests - v_request_count - 1),
    'daily_cost_usd', v_daily_cost + p_estimated_cost_usd
  );
end;
$$;

revoke all on function public.reserve_ai_usage(uuid, text, text, text, numeric, integer, integer, numeric) from public;
revoke all on function public.reserve_ai_usage(uuid, text, text, text, numeric, integer, integer, numeric) from anon;
revoke all on function public.reserve_ai_usage(uuid, text, text, text, numeric, integer, integer, numeric) from authenticated;
grant execute on function public.reserve_ai_usage(uuid, text, text, text, numeric, integer, integer, numeric) to service_role;

comment on function public.reserve_ai_usage(uuid, text, text, text, numeric, integer, integer, numeric)
is 'Atomically reserves per-user AI usage and enforces request and daily estimated-cost limits. Service role only.';
