# Automation and premium foundation

## Premium membership

The database now has a provider-neutral `subscriptions` table. Mobile users can read only their own membership row and cannot create or modify premium access. Only a verified payment webhook or another server-side operation may update it.

The app entitlement module exposes free and premium limits for:

- outfit generation
- virtual try-on
- advanced style analysis
- event stylist
- personal shopping

No checkout, charge, trial, or subscription has been created.

## Operations runner

The JWT-protected `operations-runner` Edge Function is admin-only and supports:

- `daily_health`: 24-hour product, click, try-on, outfit and AI-cost snapshot
- `weekly_insights`: seven-day snapshot using the same privacy-minimized aggregate metrics

Every run is persisted in `automation_runs`. The mobile roles have no table privileges and no RLS policy for this operational data.

Scheduling remains intentionally inactive. When production scheduling is approved, Supabase Cron may invoke the function with a secret stored in Vault. The function must never be scheduled with a key hardcoded in SQL.

