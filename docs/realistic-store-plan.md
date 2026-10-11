# WEYRA mağaza ve gerçekçi deneme — 8 Ekim 2026

## Bu sürümde çalışan akış

Ana sayfadaki mağaza seçkisi → günlük/ofis/davet → özgün ürün görseli →
aynı model stüdyosunda kategori/marka → renk ve beden kaydı → fotoğrafla deneme.
Ayrı mağaza sayfası açılmaz. Kombin panosu ve yaklaşık 3D önizleme korunur.

- Livostyle / Arcada LLC'nin MIT lisanslı açık kataloğundan 104 ürün.
- Yalnız tek renk kaydı olan ürünler; alternatif renge aitmiş gibi aynı fotoğraf gösterilmez.
- Orijinal ürün çekimleri indirilir; `v2`, `v3`, `v4` pazarlama varyantları kullanılmaz.
- Fiyat/beden/stok kaynak anlık kaydıdır; canlı sipariş garantisi değildir.
- Kumaş, kalıp, bakım, özgün kategori ve kaynak lisansı ürün detayında korunur.
- Eski 124 Commons fotoğrafı da korunur; toplam 228 ürün kaydı, ayrı varyantlar hariç.

## Görüntülerin anlamı

Başlangıçtaki kadın/erkek fotoğrafı yayımlanmış FASHN örnek modelidir; kullanıcı avatarının
ölçülerinden oluşturulmaz ve henüz kıyafet uygulanmış sonuç olarak gösterilmez.
"Seçili kıyafeti model üzerinde dene" ürünü ücretsiz FASHN VTON 1.5 Space'e gönderir.
Kullanıcı fotoğrafı ve kişisel gardırop görselleri bu ortak hizmete gönderilmez.
Yalnız bu sürümde yayımlanmış, açık lisanslı katalog fotoğraflarına izin verilir.

"Hazır AI denemesi", aynı ürün ve aynı kadın model için gerçekten üretilmiş ve elle
incelenmiş sonuçtur. Canlı üretim olarak etiketlenmez. Ürün/model değişince temizlenir.
Örnek elbisede eski sağ kol/sleeve izinin küçük bir bölümü kaldı; kusursuz sonuç değildir.

3D sekmesi ölçüye göre genel kalıp önizlemesidir; fotoğraf motoru dönebilen ürün mesh'i
üretmez. Fotoğraf gerçekçiliği, beden doğruluğu veya fiziksel kumaş simülasyonu anlamına gelmez.

## Doğrulanan sınır

Ücretsiz motor gerçek çıktı üretti; sonraki üst/alt parça ve maske iyileştirme istekleri
SSE `error` / `null` döndürdü. Sebep sağlayıcıdan ayrıntılı olarak bildirilmedi.
Bu kamu demosu üretim hizmeti olarak güvenilir değildir. Hata halinde sahte başarı,
renkli genel kalıp veya başka ürüne ait hazır görsel sonuç yerine gösterilmez.

## Tamamlanma ölçütü ve sonraki bağımlılık

Kalıcı giydirme için açık kaynak modeli kendi GPU sunucusunda çalıştırmak gerekiyor.
Ücretli API kullanılmadı; GPU barındırma henüz kurulmadı. Kişisel fotoğraf denemesi açılmadan
kimlik doğrulama, özel saklama, silme ve sınırlı kuyruk birlikte doğrulanmalı.

1. Tişört, gömlek, ceket, pantolon ve elbiseden en az 10 gerçek ürünle kalite seti.
2. Kesim, desen/logo, renk, yüz/vücut korunması ve eski kıyafet izlerini inceleme.
3. Hatalı sonuçları kullanıcıya uygulanmış başarılı deneme olarak göstermeme.
4. Başarılı örnekleri birden çok beden ve pozda görsel olarak doğrulama; fit garantisi vermeme.
5. 360 derece deneme için tedarikçi ürün kalıpları / gerçek 3D varlıklar ve kumaş simülasyonu.
6. iPhone üzerinde fiziksel test; bu sürümün mobil tarayıcı QA'sı gerçek cihaz testi değildir.

Kod ve arayüz hazır oluşu, bu kalite ölçütlerinin tamamlandığı anlamına gelmez.
