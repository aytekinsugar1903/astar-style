# ASTRA STYLE agent rules

- Keep iOS, Android and web working from the shared Expo codebase.
- Never expose service-role, AI, payment or try-on secrets in EXPO_PUBLIC variables.
- Keep paid integrations behind interfaces and provide a zero-cost mock implementation.
- Enable and test RLS for every table added to an exposed schema.
- Never authorize by user_metadata; admin roles belong in app_metadata and must be verified server-side.
- Do not scrape marketplaces without explicit permission and documented terms.
- Every user image feature must include deletion and private-storage behavior.
- Turkish and English copy must use translation keys when localization is introduced.
