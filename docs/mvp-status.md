# MVP status

## Implemented

- [x] Expo mobile/web foundation
- [x] Premium mobile-first home
- [x] Supabase client and persistent auth session
- [x] Sign up / sign in UI
- [x] User profile, editable style summary and sign-out flow
- [x] Double-confirmed account deletion with private-file cleanup and session revocation
- [x] Style profile onboarding and consent
- [x] Wardrobe list, phone gallery upload, private image preview and permanent deletion
- [x] Ownership-based RLS and private storage rules
- [x] Event and budget outfit flow with mock AI
- [x] Product search, budget/color filters and style ranking
- [x] Product detail, server-backed favorites, saved-products screen and affiliate-click hook
- [x] Personal full-body photo record
- [x] Virtual try-on job queue with locked client permissions
- [x] AI provider and try-on provider interfaces
- [x] CI configuration

## Next

- [x] Connect dedicated ASTRA STYLE Supabase project and apply migrations
- [x] Add AI garment classification Edge Function (mock provider)
- [x] Add server-only outfit generation (mock provider)
- [ ] Add FASHN adapter behind an explicit cost switch
- [ ] Add official affiliate feed adapter
- [x] Add admin dashboard
- [x] Add zero-cost demo catalog records for end-to-end product flow
- [ ] Complete translations and accessibility pass
- [ ] Add automated end-to-end tests and store builds

## Live backend

- Supabase project: `ASTRA STYLE` (`dxnfjwtlysfbasverfiw`)
- Region: Frankfurt / `eu-central-1`
- Cost: Free plan, 0 USD/month at creation
- Security: RLS enabled on all public tables; private image buckets
- Edge Functions: classify-garment, outfit, try-on, admin-dashboard, delete-account
- AI and try-on providers: mock only, 0 USD usage
- Validation: Supabase security advisor clean; GitHub CI passing

## External actions requiring owner approval

- Creating or selecting the production Supabase project
- Purchasing virtual try-on credits
- Affiliate network applications
- Apple Developer and Google Play accounts
- Domain purchase
- Production billing
