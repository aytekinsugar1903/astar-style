# WEYRA — ücretsiz sürüm tamamlama kaydı

Tarih: 3 Ekim 2026. Bu kayıt çalışan özellikleri ve dış bağlantı gerektiren işleri ayırır. Yerel demo, üretim hesabı veya mağazanın canlı kataloğu olarak sunulmaz.

| Önceki sekiz eksik | Bu sürümde yapılan | Kalan doğrulama / bağlantı |
|---|---|---|
| Telefon akışı | Taşmayan yeni sayfalar, değişken yükseklikte kartlar, model alanında seçim; mobil tarayıcı testleri | Fiziksel iPhone/Safari ve Android cihaz denemesi. Expo paket derlemesi cihaz testi değildir. |
| Hızlı dolap girişi | Tek seçimde en fazla 10 fotoğraf, yerel normalizasyon, sırayla arka plan temizleme, durdurma, orijinale dönüş, isim/renk incelemesi | Otomatik doğru kategori tanıma yok. Kullanıcı fotoğrafı inceleyip kategori ve rengi seçer. |
| Takvim ve analiz | Kombin planı, giyme geçmişi, aynı gün tekrar kayıt koruması, gerçek alış fiyatından kullanım başına maliyet, valiz listeleri | Kayıtlar cihazda; geçmiş ve fiyat girilmeden istatistik uydurulmaz. |
| Mağaza kataloğu | JSON/CSV/Google XML/WooCommerce, orijinal kategoriler/varyantlar, kayıtlı izinli kaynak, uygulama açıkken günlük güncelleme, eksik güncellemede son kataloğu koruma | Markanın izinli feed/API adresi ve gerektiğinde CORS sağlayan sunucu. Açık lisanslı birkaç fotoğraf tam marka kataloğu değildir. |
| Ürüne özel giydirme | Kesintisiz referans gövde ve 18 WEYRA GLB kalıbı, kaynak/lisans bilgisi olan uyumlu GLB alımı; tek model alanında seçim | Native uygulamada ölçü çizimi kullanılır; WebGL modeli web sürümündedir. Gerçek mağaza ürününün üretici 3D kalıbı veya gerçek sanal deneme hizmeti. Genel kalıp ürünün birebir kumaşı/kesimi değildir; fizik simülasyonu yok. |
| Kişiselleştirme | Dolaptaki parçaları önceleme, beğeni/red, tercih renkleri, etkinlik/hava/zemin kuralları, kullanım geçmişi, tercihi sıfırlama | Yerel kural sistemi; davranış verisi sunucuya gönderilmez. Ölçüden beden garantisi verilmez. |
| Hesap ve yedek | Fotoğrafları içeren JSON yedeği, vücut fotoğrafına ayrı seçim, anahtar/şema/URL doğrulama, incelenmiş geri yükleme, başarısız yazmada geri alma, kişisel veriyi silme | Gerçek hesaplar, cihazlar arası bulut eşitleme ve sunucuda RLS testleri yapılandırılmış backend ister. Oturum anahtarları yedeğe alınmaz. |
| Stilist ve paylaşım | Kendi dolabından öneri, gönderilmediği açıkça belirtilen stilist taslağı, taslak indirme/silme, seçili kombin dosyasını paylaşma | İnsan stilist operasyonu, talep iletimi, ödeme ve abonelik servisleri bağlı değil; ücretsiz demo ödeme almaz. |

## Kataloğun güncellenmesi

Kaynak ancak kullanıcı izin kutusunu seçip önizlemeyi uyguladığında kaydedilir. Otomatik kontrol uygulama açılışında, etkinleştiğinde ve açıkken yapılır; son kontrolün üzerinden 24 saat geçmeden tekrar sorgulamaz. Arka planda çalışan bulut işi yoktur. Hatalı satır, boş kaynak, ağ hatası ve 10'dan fazla ürünlü kaynağın yarısından fazlasını kaybetmesi güncellemeyi durdurur. Manuel önizleme, gerçek ürün kaldırmalarını inceleyip uygulamaya izin verir. Kaldırılan bağlantı yeniden oluşturulmaz. Eşzamanlı katalog yazmaları seri uygulanır.

## Yerel yedek ve silme

Yedek en fazla 8 MB UTF-8 JSON'dur. Yerel dolap fotoğrafları dahildir; kişisel vücut fotoğrafı varsayılan olarak hariçtir. Auth/session anahtarları dahil değildir. İncelenen gruplar değişir; dosyada bulunmayan gruplar korunur. Geri yüklemeden sonra sayfa yenilenmeli veya uygulama yeniden açılmalıdır. Yedek hassas fotoğraf içerebilir; dosyayı paylaşma kararı kullanıcıya aittir. Native paylaşım JSON metnidir, web indirilebilir dosyadır.

## Ücretli/API sınırındaki somut ihtiyaçlar

1. Mağaza başına izinli ürün kaynağı, kullanım lisansı, varyant görselleri ve güncelleme şartları.
2. Üreticiden uyumlu `weyra-v1` GLB veya sanal deneme sağlayıcı sözleşmesi, kimlik bilgileri, sunucu bağlantısı ve doğruluk testi.
3. Yapılandırılmış özel backend: hesap, özel fotoğraf deposu, erişim politikaları, silme, senkronizasyon ve felaket kurtarma.
4. İnsan stilist iş akışı ve gerçek ödeme/abonelik sağlayıcısı.

Bu bağlantılar olmadan sekiz alanın tamamını üretim seviyesinde eksiksiz ilan etmek doğru değildir.

## Doğrulama kaydı

- TypeScript: geçti. Türkçe/İngilizce: 797 anahtar geçti.
- 41 farklı tarayıcı senaryosu, düzeltmeler sonrası ilgili senaryoların tekrarları dahil geçti. İlk kapsamlı turda 37/40 geçti; üç hata düzeltildi, bu senaryolar ve yeni ekran görüntüsü senaryosu geçti. Son model kontrollerinde dokuz mevcut senaryo ve düzeltilmiş ekran boyutu kontrolü geçti.
- Tarih, kullanım sayısı, maliyet, valiz, eşzamanlı tercihler, yedek gizliliği/şeması/geri alma: geçti.
- Katalog JSON/CSV/XML/WooCommerce ve günlük yenileme, eksik kaynak koruması, kaldırılmış bağlantı, eşzamanlı aktarım: geçti.
- Kombin, stilist, sağlayıcı sınırları ve 124 fotoğrafın kaynak/lisans kontrolleri: geçti.
- Web, iOS ve Android paket dışa aktarımları: geçti. Fiziksel cihaz ve gerçek hesap/mağaza bağlantısı testi yapılmadı.
- Gerçek yerel web ekran görüntüleri: `docs/qa/model-mobile.png`, `planner-mobile.png`, `backup-mobile.png`. Planlayıcı görüntüsü test gardırobundan alınmıştır.
