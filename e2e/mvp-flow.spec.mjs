import {readFileSync} from 'node:fs';
import { expect, test } from "@playwright/test";
async function openRack(page,category){const back=page.getByRole('button',{name:'Kategori askılığı',exact:true});if(await back.count())await back.click();await page.getByTestId('category-rack').getByRole('button',{name:category,exact:true}).click();const close=page.getByRole('button',{name:'Kapat',exact:true});if(await close.count())await close.click();}


test("language preference persists across navigation", async ({ page }) => {
  await page.goto("/profile");
  await page.getByText("English", { exact: true }).click();
  await expect(page.getByText("My profile", { exact: true })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("A good day.", { exact: false })).toBeVisible();
  await expect(page.getByText("Add a garment", { exact: false })).toBeVisible();
  await expect(page.getByText("My profile", { exact: true })).not.toBeVisible();
});

test("onboarding completes in demo mode", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByText("Minimal", { exact: true }).click();
  await page.getByText("Siyah", { exact: true }).click();
  await page.getByText("Fotoğraflarımın yalnızca", { exact: false }).click();
  await page.getByText("Gardırobuma geç", { exact: false }).click();

  await expect(page).toHaveURL(/\/wardrobe/);
  await expect(page.getByText("Gardırobum", { exact: true })).toBeVisible();
});

test("wardrobe and outfit demo flows work", async ({ page }) => {
  await page.goto("/wardrobe");
  await expect(page.getByText("80 parça", { exact: true })).toBeVisible();
  const chooser=page.waitForEvent('filechooser');
  await page.getByText("+ Kıyafet ekle", { exact: true }).click();
  await (await chooser).setFiles('assets/garments/tshirt.jpg');
  await page.getByText("Dolaba ekle",{exact:true}).click();
  await expect(page.getByText("81 parça", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("81 parça", { exact: true })).toBeVisible();

  await page.goto("/outfit");
  await expect(page.getByText("768 farklı kadın, erkek ve unisex kombin şablonu hazır.", { exact: true })).toBeVisible();
  await page.getByText("Parti", { exact: true }).click();
  await expect(page.getByLabel("Etkinlik")).toHaveValue("Parti");
  await page.getByText("Kombinleri hazırla", { exact: false }).click();
  await expect(page.getByText("6 farklı kombin seçeneği", { exact: true })).toBeVisible();
  await expect(page.getByText("Parti · Minimal seçenek 1", { exact: true })).toBeVisible();
  await expect(page.getByText("4 gardırop parçası kullanıldı", { exact: true }).first()).toBeVisible();
  await page.getByText("Kombin geçmişimi gör", { exact: false }).click();
  await expect(page).toHaveURL(/\/planner/);
  await expect(page.getByText("Takvim ve gardırop analizi", { exact: true })).toBeVisible();
});


test("men collection exposes a broad catalog", async ({ page }) => {
  await page.goto("/products");
  await page.getByText("Erkek", { exact: true }).click();
  await expect(page.getByText("46 ürün", { exact: false })).toBeVisible();
  await expect(page.getByText("Lacivert Yapılı Blazer", { exact: true })).toBeVisible();
  await expect(page.getByText("Lacivert İki Parça Takım", { exact: true })).toBeVisible();
});

test("product filtering reaches product detail", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText("169 ürün", { exact: false })).toBeVisible();
  await page.getByLabel("En yüksek bütçe (TL)").fill("2000");
  await page.getByText("Dökümlü Siyah Elbise", { exact: true }).click();

  await expect(page).toHaveURL(/\/product\/p2/);
  await expect(page.getByText("1.890 TL", { exact: true }).last()).toBeVisible();
  await expect(page.getByText(/^Stokta · Demo ürün$/)).toBeVisible();
});

test("virtual try-on shows a real selected photo and states unavailable generation", async ({ page }) => {
  await page.goto("/try-on");
  const chooser=page.waitForEvent('filechooser');
  await page.getByText("Fotoğraf seç", { exact: true }).click();
  await (await chooser).setFiles('assets/garments/jeans-blue.jpg');
  await expect(page.getByText("Seçtiğin fotoğraf yalnızca", { exact: false })).toBeVisible();
  await page.getByText("Gardırobumdaki parçayı dene", { exact: false }).click();
  await expect(page.getByText("Gerçekçi sanal giydirme henüz bağlı değil", { exact: false })).toBeVisible();
});

test("cloud accounts stay hidden in the local release", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText("Kaydettiklerimi gör", { exact: false })).toHaveCount(0);
  await page.goto("/favorites");
  await expect(page.getByText("Giriş yap", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Tekrar hoş geldin.", { exact: true })).toHaveCount(0);
  await page.goto("/sign-in");
  await expect(page.getByText("Giriş yap", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Tekrar hoş geldin.", { exact: true })).toHaveCount(0);
  await page.goto("/admin");
  await expect(page.getByText("WEYRA Control", { exact: true })).toHaveCount(0);
});

test("stylist answers in conversation and exposes human request boundary", async ({ page }) => {
  await page.goto("/stylist");
  await page.getByLabel("Örn. Düğüne gidiyorum, 3.000 TL bütçem var").fill("Düğüne gidiyorum, 3.000 TL bütçem var");
  await page.getByText("Sor", { exact: true }).click();
  await expect(page.getByText("3.000", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Stilist talebi hazırla", { exact: true })).toBeVisible();
});

test("outfit board places and moves a piece", async ({ page }) => {
  await page.goto("/board");
  await page.getByText("Boğazlı örgü kazak", { exact: true }).click();
  await expect(page.getByRole('img',{name:'Boğazlı örgü kazak'})).toBeVisible();
  const img=page.getByRole('img',{name:'Boğazlı örgü kazak'});await img.scrollIntoViewIfNeeded();const before=await img.boundingBox();
  await page.mouse.move(before.x+40,before.y+50);await page.mouse.down();await page.mouse.move(before.x+100,before.y+130,{steps:8});await page.mouse.up();
  const after=await img.boundingBox();expect(after.x).toBeGreaterThan(before.x+30);
  await page.getByText("Kombini kaydet", { exact: true }).click();
  await expect(page.getByText("Kombin kaydedildi", { exact: false })).toBeVisible();
});


test("outfit context filters products and carries try-on selection", async ({ page }) => {
  await page.goto("/products?query=Ayakkabı&budget=1500");
  await expect(page.getByText("Kombinindeki eksik parçaya", { exact: false })).toBeVisible();
  await expect(page.getByText("İnce Topuklu Ayakkabı", { exact: true })).toBeVisible();

  await page.goto("/try-on?wardrobeItemId=demo-dress");
  await expect(page.getByText("DENENECEK PARÇA", { exact: true })).toBeVisible();
  await expect(page.getByText("Kombinden seçilen parça", { exact: true })).toBeVisible();
});


test("real rack photo opens detail and carries the piece into the board", async ({page})=>{
 await page.goto('/');await openRack(page,'Kazak');
 await page.getByTestId('garment-rack').getByRole('button',{name:'Boğazlı örgü kazak',exact:true}).click();
 await page.getByText('Panoya ekle',{exact:true}).click();
 await expect(page).toHaveURL(/board/);
 await expect(page.getByRole('img',{name:'Boğazlı örgü kazak'})).toBeVisible();
});


test("wardrobe can switch from grid to rack", async ({ page }) => {
  await page.goto("/wardrobe");
  await page.getByText("Vitrin / Askılık", { exact: true }).click();
  await expect(page).toHaveURL(/\/showcase/);
  await expect(page.getByText("Askılığın.", { exact: true })).toBeVisible();
});



test('category rack opens every real photo in each category and stays within the viewport',async({page})=>{
 await page.goto('/');await expect(page.getByTestId('category-rack').getByRole('button')).toHaveCount(10);await expect(page.getByTestId('garment-rack')).toHaveCount(0);
 for(const [category,total] of [['Tişört',10],['Kazak',6],['Gömlek',9],['Pantolon',7],['Ayakkabı',9],['Elbise',9],['Etek',9],['Ceket',6],['Çanta',8],['Aksesuar',7]]){
  await openRack(page,category);await expect(page.getByTestId('category-rack')).toHaveCount(0);await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(total);
  await expect.poll(()=>page.getByTestId('garment-rack').locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth>0).length)).toBe(total);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
 await page.getByRole('button',{name:'Kategori askılığı',exact:true}).click();await expect(page.getByTestId('category-rack').getByRole('button')).toHaveCount(10);
});

test('observed offers compare shipping-inclusive totals without claiming live prices',async({page})=>{
 await page.goto('/alternatives?query=Kazak');
 await expect(page.getByText('Canlı mağaza fiyat akışı henüz bağlı değil.',{exact:false})).toBeVisible();
 await page.getByPlaceholder('Mağaza adı',{exact:true}).fill('Test mağaza');
 await page.getByPlaceholder('Ürün bağlantısı (https://)',{exact:true}).fill('https://example.com/product');
 await page.getByPlaceholder('Ürün fiyatı (TL)',{exact:true}).fill('500');
 await page.getByPlaceholder('Kargo ücreti (TL)',{exact:true}).fill('50');
 await page.getByText('Teklifi kaydet',{exact:true}).click();
 await expect(page.getByText('Test mağaza · 550 TL',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText('Test mağaza · 550 TL',{exact:true})).toBeVisible();
});


test('category models and colours filter actual photos',async({page})=>{
 await page.goto('/');await openRack(page,'Tişört');await page.getByText('Polo / yakalı',{exact:true}).click();
 await expect(page.getByLabel('Polo yaka tişört',{exact:true})).toBeVisible();await expect(page.getByLabel('Mavi basic tişört',{exact:true})).toHaveCount(0);
 await openRack(page,'Pantolon');await page.getByText('Keten',{exact:true}).click();await expect(page.getByText('Bu model ve renkte fotoğraf henüz yok.',{exact:false})).toBeVisible();
});
test('colour selection replaces the actual tee photo and carries selected piece',async({page})=>{
 await page.goto('/');await openRack(page,'Tişört');await page.getByTestId('garment-rack').getByRole('button',{name:'Mavi basic tişört',exact:true}).click();
 const detail=page.getByText('Renk seçimi, aynı kategorideki',{exact:false});await expect(detail).toBeVisible();
 await page.getByLabel('Kırmızı',{exact:true}).last().click();await expect(page.getByText('Kırmızı bisiklet yaka tişört',{exact:true}).last()).toBeVisible();
 await page.getByText('Panoya ekle',{exact:true}).click();await expect(page.getByRole('img',{name:'Kırmızı bisiklet yaka tişört'})).toBeVisible();
});
test('six avatar regions change independently, persist and reset',async({page})=>{
 await page.goto('/avatar');await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();const labels=['Alt baldır','Üst baldır','Kalça','Bel','Göğüs','Omuzlar'];
 for(const label of labels){await expect(page.getByText(label+' · 100%',{exact:true})).toBeVisible();}
 for(const label of labels){await page.getByRole('button',{name:label+' Kalınlaştır',exact:true}).click();await expect(page.getByText(label+' · 105%',{exact:true})).toBeVisible();for(const other of labels.filter(x=>x!==label)){await expect(page.getByText(other+' · 100%',{exact:true})).toBeVisible();}await page.getByRole('button',{name:label+' İncelt',exact:true}).click();}
 await page.getByRole('button',{name:'Alt baldır Kalınlaştır',exact:true}).click();await expect(page.getByText('Alt baldır · 105%',{exact:true})).toBeVisible();await expect(page.getByText('Göğüs · 100%',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Omuzlar İncelt',exact:true}).click();await page.getByLabel('Boy',{exact:true}).fill('185');await page.getByText('Ölçülerimi kaydet',{exact:true}).click();await page.reload();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();
 await expect(page.getByLabel('Boy',{exact:true})).toHaveValue('185');await expect(page.getByText('Alt baldır · 105%',{exact:true})).toBeVisible();await expect(page.getByText('Omuzlar · 95%',{exact:true})).toBeVisible();
 await page.getByText('Bölge oranlarını sıfırla',{exact:true}).click();for(const label of labels)await expect(page.getByText(label+' · 100%',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Ölçü profilimi sil',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();await expect(page.getByLabel('Boy',{exact:true})).toHaveValue('172');
});
test('avatar regional controls respect width limits',async({page})=>{
 await page.goto('/avatar');await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();for(let i=0;i<8;i++)await page.getByRole('button',{name:'Bel Kalınlaştır',exact:true}).click();await expect(page.getByText('Bel · 140%',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Bel Kalınlaştır',exact:true})).toBeDisabled();
 for(let i=0;i<14;i++)await page.getByRole('button',{name:'Bel İncelt',exact:true}).click();await expect(page.getByText('Bel · 70%',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Bel İncelt',exact:true})).toBeDisabled();await expect(page.getByText('Göğüs · 100%',{exact:true})).toBeVisible();
});
test('old two-part avatar profiles migrate to six regions',async({page})=>{
 await page.goto('/avatar');await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();await page.evaluate(()=>localStorage.setItem('weyra:avatar:v1',JSON.stringify({measurements:{height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54},torso:110,legs:90,selected:{}})));await page.reload();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();
 for(const label of ['Bel','Göğüs','Omuzlar'])await expect(page.getByText(label+' · 110%',{exact:true})).toBeVisible();for(const label of ['Alt baldır','Üst baldır','Kalça'])await expect(page.getByText(label+' · 90%',{exact:true})).toBeVisible();
});
test('avatar rejects impossible measurements and rack choice opens correct slot',async({page})=>{
 await page.goto('/avatar?piece=photo-blue-jeans');await expect(page.getByText('Mavi kot pantolon',{exact:true}).last()).toBeVisible();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();
 await page.getByLabel('Boy',{exact:true}).fill('20');await page.getByText('Ölçülerimi kaydet',{exact:true}).click();await expect(page.getByText('Ölçüleri belirtilen aralıklarda gir.',{exact:false})).toBeVisible();
});

test('own photo model and colour metadata survive reload and filtering',async({page})=>{
 await page.goto('/');const chooser=page.waitForEvent('filechooser');await page.getByText('+ Kıyafet ekle',{exact:true}).click();await (await chooser).setFiles('assets/garments/chino.jpg');
 await page.getByPlaceholder('Kıyafet adı',{exact:true}).fill('Keten fotoğrafım');await page.getByText('Pantolon',{exact:true}).last().click();await page.getByText('Keten',{exact:true}).click();await page.getByText('Bej',{exact:true}).last().click();
 await page.getByText('Askılığıma ekle',{exact:true}).click();await page.reload();await openRack(page,'Pantolon');await page.getByText('Keten',{exact:true}).click();await page.getByLabel('Bej',{exact:true}).click();await expect(page.getByLabel('Keten fotoğrafım',{exact:true})).toBeVisible();
});

test('dark mode persists and follows navigation',async({page})=>{
 await page.goto('/');await page.getByLabel('Koyu mod',{exact:true}).click();
 await expect(page.getByLabel('Açık mod',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByLabel('Açık mod',{exact:true})).toBeVisible();
 await page.goto('/avatar');await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();await expect.poll(()=>page.getByText('Model stüdyosu',{exact:true}).evaluate(el=>getComputedStyle(el).color)).toBe('rgb(230, 239, 232)');
 await page.goto('/');await page.getByLabel('Açık mod',{exact:true}).click();await page.reload();await expect(page.getByLabel('Koyu mod',{exact:true})).toBeVisible();
});

test('personal reference photo persists beside avatar and can be deleted',async({page})=>{
 await page.goto('/avatar');await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();const chooser=page.waitForEvent('filechooser');await page.getByText('Fotoğrafımı ekle',{exact:true}).click();await (await chooser).setFiles('assets/garments/dress.jpg');
 await expect(page.getByRole('img',{name:'Kendi fotoğrafım'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();await expect(page.getByRole('img',{name:'Kendi fotoğrafım'})).toBeVisible();
 await page.getByText('Fotoğrafımı sil',{exact:true}).click();await page.reload();await page.getByRole('button',{name:'Ölçülerim · cm',exact:true}).click();await expect(page.getByRole('img',{name:'Kendi fotoğrafım'})).toHaveCount(0);
});

test('brand filter works inside a category and opening another resets choices',async({page})=>{
 await page.goto('/');await openRack(page,'Ayakkabı');await page.getByText('Marka belirtilmedi',{exact:true}).click();await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(9);
 await expect(page.getByLabel('Siyah derby kundura',{exact:true})).toBeVisible();await openRack(page,'Tişört');await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(10);
 expect((await page.getByLabel('Mavi basic tişört',{exact:true}).boundingBox()).width).toBeLessThan(130);
});

test('closet photo produces two distinct real crops with metadata and deletion',async({page})=>{
 await page.goto('/capture');const chooser=page.waitForEvent('filechooser');await page.getByText('Dolap fotoğrafı seç',{exact:true}).click();await (await chooser).setFiles('assets/garments/formal.jpg');
 const area=page.getByLabel('Dolap fotoğrafında parça alanı',{exact:true});await expect(area).toBeVisible();
 await area.click({position:{x:12,y:15}});const bounds=await area.boundingBox();await area.click({position:{x:bounds.width*.55,y:bounds.height*.65}});await page.getByText('Bu parçayı ayır',{exact:true}).click();
 await expect(page.getByRole('img',{name:'Parça 1'})).toBeVisible();await page.getByLabel('Parça adı',{exact:true}).fill('Ayırdığım ayakkabı');await page.getByPlaceholder('Marka (isteğe bağlı)',{exact:true}).fill('Deneme markam');
 await area.click({position:{x:bounds.width*.6,y:bounds.height*.2}});await area.click({position:{x:bounds.width*.94,y:bounds.height*.8}});await page.getByText('Bu parçayı ayır',{exact:true}).click();await expect(page.getByRole('img',{name:'Parça 2'})).toBeVisible();
 const crops=await page.getByRole('img',{name:/Ayırdığım ayakkabı|Parça 2/}).evaluateAll(imgs=>imgs.map(i=>({src:i.src,width:i.naturalWidth})));expect(crops).toHaveLength(2);expect(crops[0].src).not.toBe(crops[1].src);expect(crops[0].width).toBe(500);
 await page.getByText('Siyah',{exact:true}).nth(0).click();await page.getByText('Mavi',{exact:true}).nth(1).click();await page.getByText('2 parçayı askılığıma ekle',{exact:true}).click();await expect(page.getByText('Parçalar ayrı fotoğraflar olarak bu cihazda kaydedildi.',{exact:true})).toBeVisible();
 await page.goto('/');await openRack(page,'Tişört');await page.getByText('Deneme markam',{exact:true}).click();await page.getByLabel('Ayırdığım ayakkabı',{exact:true}).click();await page.getByText('Fotoğrafı cihazdan sil',{exact:true}).click();await page.reload();await expect(page.getByLabel('Ayırdığım ayakkabı',{exact:true})).toHaveCount(0);
});

test('garment search, favorites and editing persist',async({page})=>{
 await page.goto('/');await openRack(page,'Tişört');
 const first=page.getByTestId('garment-rack').getByRole('button').first();await first.click();
 await page.getByRole('button',{name:'Favorilere ekle',exact:true}).click();await page.getByText('Kapat ×',{exact:true}).click();
 await page.getByRole('button',{name:'Favorilerim',exact:true}).click();await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(1);
 await page.reload();await openRack(page,'Tişört');await page.getByRole('button',{name:'Favorilerim',exact:true}).click();await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(1);
 await page.getByLabel('İsim veya markayla ara').fill('olmayan parça');await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(0);
 await page.getByLabel('İsim veya markayla ara').fill('');
 const chooser=page.waitForEvent('filechooser');await page.getByText('+ Kıyafet ekle',{exact:true}).click();await (await chooser).setFiles('assets/garments/jeans-blue.jpg');
 await page.getByPlaceholder('Kıyafet adı').fill('Deneme tişörtüm');await page.getByText('Askılığıma ekle',{exact:true}).click();
 await page.getByRole('button',{name:'Kendi dolabım',exact:true}).click();await page.getByTestId('garment-rack').getByRole('button',{name:'Deneme tişörtüm',exact:true}).click();
 await page.getByRole('button',{name:'Parçayı düzenle',exact:true}).click();await page.getByPlaceholder('Kıyafet adı').fill('Yeni ad');await page.getByText('Değişiklikleri kaydet',{exact:true}).click();
 await page.reload();await openRack(page,'Tişört');await page.getByRole('button',{name:'Kendi dolabım',exact:true}).click();await expect(page.getByTestId('garment-rack').getByRole('button',{name:'Yeni ad',exact:true})).toBeVisible();
});

test('free local background removal produces transparent pixels and preserves original',async({page})=>{
 test.setTimeout(90000);await page.goto('/');const outgoing=[];page.on('request',r=>{if(r.method()!=='GET')outgoing.push(r.url());});
 const chooser=page.waitForEvent('filechooser');await page.getByText('+ Kıyafet ekle',{exact:true}).click();await (await chooser).setFiles('assets/garments/jeans-blue.jpg');
 await page.getByRole('button',{name:'Arka planı temizle',exact:true}).click();await expect(page.getByText('Orijinal fotoğrafa dön',{exact:true})).toBeVisible({timeout:60000});
 const result=await page.evaluate(()=>{const img=[...document.querySelectorAll('img')].find(i=>i.src.startsWith('data:image/png;base64,'));if(!img)return null;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let transparent=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]>200)opaque++;}return {transparent,opaque};});
 expect(result?.transparent).toBeGreaterThan(100);expect(result?.opaque).toBeGreaterThan(100);expect(outgoing).toEqual([]);
 await page.getByText('Orijinal fotoğrafa dön',{exact:true}).click();await expect(page.getByText('Orijinal fotoğrafa dön',{exact:true})).toHaveCount(0);
});

test('local profile name persists',async({page})=>{await page.goto('/profile');await page.getByLabel('Görünen ad').fill('Aytekin');await page.getByRole('button',{name:'Profili kaydet',exact:true}).click();await page.reload();await expect(page.getByLabel('Görünen ad')).toHaveValue('Aytekin');});


test('experimental local separation proposes two disconnected real garments',async({page})=>{
 test.setTimeout(90000);await page.goto('/capture');
 const inputs=['assets/garments/tshirt.jpg','assets/garments/jeans-blue.jpg'].map(p=>'data:image/jpeg;base64,'+readFileSync(p).toString('base64'));
 const fixture=await page.evaluate(async sources=>{const c=document.createElement('canvas');c.width=1000;c.height=700;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1000,700);for(let i=0;i<sources.length;i++){const img=new Image();img.src=sources[i];await img.decode();const scale=Math.min(330/img.naturalWidth,520/img.naturalHeight);const w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,70+i*520,70,w,h);}return c.toDataURL('image/png').split(',')[1];},inputs);
 const chooser=page.waitForEvent('filechooser');await page.getByText('Dolap fotoğrafı seç',{exact:true}).click();await (await chooser).setFiles({name:'closet.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
 await page.getByRole('button',{name:'Ayrı duran parçaları bul · deneysel',exact:true}).click();await expect(page.getByLabel('Parça adı')).toHaveCount(2,{timeout:60000});
 await expect(page.getByText('2 parça önerisi hazır.',{exact:false})).toBeVisible();
});

test('photo outfit suggestions carry real pieces to the editable board',async({page})=>{
 await page.goto('/outfit');await page.getByText('Kombinleri hazırla',{exact:false}).click();
 await expect(page.getByRole('button',{name:'Bu kombini panoda düzenle',exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Bu kombini panoda düzenle',exact:true}).first().click();
 await expect(page).toHaveURL(/board.*pieces=photo/);await expect(page.getByRole('button',{name:/^Remove /}).first()).toBeVisible();
});

test('local onboarding choices persist into the profile',async({page})=>{
 await page.goto('/onboarding');await page.getByText('Minimal',{exact:true}).click();await page.getByText('Siyah',{exact:true}).click();await page.getByText('Fotoğraflarımın yalnızca',{exact:false}).click();await page.getByText('Gardırobuma geç',{exact:false}).click();await page.goto('/profile');await expect(page.getByText('Minimal',{exact:true})).toBeVisible();await expect(page.getByText('Siyah',{exact:true})).toBeVisible();
});


test('rack hover keeps pieces upright without moving hit areas',async({page})=>{
 await page.goto('/');const knit=page.getByTestId('rack-category-knit');const turn=page.getByTestId('rack-turn-knit');
 await expect.poll(()=>turn.evaluate(el=>el.style.transform)).toContain('rotateY(0deg)');const before=await knit.boundingBox();
 await knit.hover();await expect.poll(()=>turn.evaluate(el=>el.style.transform)).toContain('rotateY(0deg)');
 const after=await knit.boundingBox();expect(after.x).toBe(before.x);expect(after.width).toBe(before.width);
 await page.getByTestId('rack-category-tshirt').hover();await expect.poll(()=>turn.evaluate(el=>el.style.transform)).toContain('rotateY(0deg)');await expect.poll(()=>page.getByTestId('rack-turn-tshirt').evaluate(el=>el.style.transform)).toContain('rotateY(0deg)');
 const rail=page.getByTestId('category-rack');await rail.evaluate(el=>{el.scrollLeft=0;});await page.getByRole('button',{name:'Askılığı sağa kaydır',exact:true}).click();await expect.poll(async()=>{const a=await rail.evaluate(el=>el.scrollLeft);await page.waitForTimeout(90);const b=await rail.evaluate(el=>el.scrollLeft);return Math.abs(a-b)<0.5?b:0;}).toBeGreaterThan(200);
 await page.getByRole('button',{name:'Askılığı sola kaydır',exact:true}).click();await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeLessThan(10);
 const box=await rail.boundingBox();await page.mouse.move(box.x+box.width-25,box.y+110);await page.mouse.down();await page.mouse.move(box.x+30,box.y+112,{steps:15});await page.mouse.up();await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(100);await expect(rail).toBeVisible();
});
test('touch rack previews on first tap and opens category on second tap',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();try{await page.goto('http://127.0.0.1:4173');const tee=page.getByTestId('rack-category-tshirt');await tee.tap();await expect(page.getByTestId('category-rack')).toBeVisible();await expect.poll(()=>page.getByTestId('rack-turn-tshirt').evaluate(el=>el.style.transform)).toContain('rotateY(0deg)');await tee.tap();await page.getByRole('button',{name:'Kapat',exact:true}).click();await expect(page.getByTestId('garment-rack').getByRole('button')).toHaveCount(10);}finally{await context.close();}
});

test('touch swipe moves rack without opening a category',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();try{await page.goto('http://127.0.0.1:4173');const rail=page.getByTestId('category-rack');await rail.scrollIntoViewIfNeeded();const box=await rail.boundingBox();const client=await context.newCDPSession(page);const x=box.x+box.width-25,y=box.y+100;await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=12;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*20,y}]});await page.waitForTimeout(16);}await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(100);await expect(rail).toBeVisible();await expect(page.getByTestId('garment-rack')).toHaveCount(0);}finally{await context.close();}
});
