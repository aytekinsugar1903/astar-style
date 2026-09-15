# MVP status

## Implemented

- [x] Expo mobile/web foundation
- [x] Premium mobile-first home
- [x] Supabase client and persistent auth session
- [x] Sign up / sign in UI
- [x] User profile, editable style summary and sign-out flow
- [x] Persistent Turkish/English experience across all MVP and admin screens
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
- [x] CI with typecheck, translation integrity, Expo Doctor, web export, and six mobile browser flows
- [x] Per-user AI quotas, daily estimated-cost guards, and localized function errors
- [x] Privacy-minimized authenticated client error events
- [x] EAS preview/production build profiles (credentials not connected)

## Next

- [x] Connect dedicated ASTRA STYLE Supabase project and apply migrations
- [x] Add AI garment classification Edge Function (mock provider)
- [x] Add server-only outfit generation (mock provider)
- [ ] Add FASHN adapter behind an explicit cost switch
- [ ] Add official affiliate feed adapter
- [x] Add admin dashboard
- [x] Add zero-cost demo catalog records for end-to-end product flow
- [x] Translate MVP feature screens and add core accessibility roles/labels
- [x] Add isolated demo-mode end-to-end tests
- [ ] Add signed App Store and Play Store builds

## Live backend

- Supabase project: `ASTRA STYLE` (`dxnfjwtlysfbasverfiw`)
- Region: Frankfurt / `eu-central-1`
- Cost: Free plan, 0 USD/month at creation
- Security: RLS enabled on all public tables; private image buckets
- Edge Functions: classify-garment v2, outfit v3 (TR/EN), try-on v2, admin-dashboard v2, delete-account v2
- AI and try-on providers: mock only, 0 USD usage
- Validation: Supabase security advisor clean; GitHub CI checks type safety, translations, Expo health, web export, and mobile MVP journeys

## External actions requiring owner approval

- Purchasing virtual try-on credits
- Affiliate network applications
- Apple Developer and Google Play accounts
- Domain purchase
- Production billing
