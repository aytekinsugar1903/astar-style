revoke all on public.subscriptions from anon;

drop policy if exists automation_runs_deny_client_access on public.automation_runs;
create policy automation_runs_deny_client_access
on public.automation_runs for all to authenticated
using (false)
with check (false);

