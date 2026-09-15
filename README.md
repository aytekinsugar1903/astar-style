# ASTRA STYLE

AI destekli kişisel stil, dijital gardırop, kombin, sanal deneme ve alışveriş platformu.

## MVP temeli

- Expo + React Native + TypeScript: iOS, Android ve responsive web
- Supabase: Auth, PostgreSQL, private Storage ve Row Level Security
- Sağlayıcıdan bağımsız AI ve virtual try-on adaptörleri
- Türkçe/İngilizce altyapısına uygun yapı
- AI maliyet ve ürün/affiliate olay takibi

## Güvenlik

Mobil uygulamada yalnızca Supabase publishable key bulunur. Service-role ve AI anahtarları sunucu tarafında kalır. Kullanıcı fotoğrafları private bucket'larda, kısa süreli signed URL ile erişilir.

## Yerel başlangıç

```bash
npm install
cp .env.example .env
npm run start
```

Detaylar: [docs/architecture.md](docs/architecture.md)
\n\n### Kombin öğrenme döngüsü\n\nEtkinlik stilisti, stil profili ve beğenilen kombin sinyallerini kullanır. Üretilen kombinler kullanıcı hesabına kaydedilir; beğeniler sonraki sıralamayı kişiselleştirir. Mevcut sağlayıcı ücretsiz mock modundadır.\n