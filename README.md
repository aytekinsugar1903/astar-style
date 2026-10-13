# WEYRA

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


### Kombin öğrenme döngüsü

Etkinlik stilisti, stil profili ve beğenilen kombin sinyallerini kullanır. Üretilen kombinler bu cihazda saklanır; beğeniler sonraki sıralamayı kişiselleştirir. Mevcut sağlayıcı yerel mock modundadır.

### Yerel demo kapsamı

Yerel katalog 80 sentetik üründen oluşur ve kadın, erkek ve unisex koleksiyonları kapsar. Ürün araması kategori, renk, stil, stok ve bütçe filtrelerini birlikte uygular. Kombin motoru 3 koleksiyon × 8 etkinlik × 4 mevsim × 8 stil üzerinden 768 temel şablon üretir ve her istekte en uygun 6 farklı seçeneği döndürür.



## Bundled image runtime

The ONNX WebAssembly runtime is stored losslessly as `vendor/ort-wasm-simd-threaded.wasm.gz` to keep upload payloads manageable. `npm ci` / `npm install` restores it to its original path and verifies SHA-256 before use. If installation scripts are disabled, run `node scripts/restore-large-assets.mjs` before starting or exporting the app. No runtime download or third-party request is added.
