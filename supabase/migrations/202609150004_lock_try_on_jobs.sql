drop policy if exists try_on_owner_all on public.try_on_jobs;

create policy try_on_owner_select
on public.try_on_jobs for select to authenticated
using ((select auth.uid()) = user_id);

create policy try_on_owner_insert
on public.try_on_jobs for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'queued'
  and estimated_cost_usd = 0
  and result_image_path is null
  and completed_at is null
  and error_code is null
);

create policy try_on_owner_delete_queued
on public.try_on_jobs for delete to authenticated
using ((select auth.uid()) = user_id and status = 'queued');
