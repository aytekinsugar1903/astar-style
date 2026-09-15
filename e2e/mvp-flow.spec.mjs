import { expect, test } from "@playwright/test";

test("language preference persists across navigation", async ({ page }) => {
  await page.goto("/profile");
  await page.getByText("English", { exact: true }).click();
  await expect(page.getByText("My profile", { exact: true })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("What will you", { exact: false })).toBeVisible();
  await expect(page.getByText("Your style space", { exact: true })).toBeVisible();
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
  await expect(page.getByText("2 parça", { exact: true })).toBeVisible();
  await page.getByText("+ Kıyafet ekle", { exact: true }).click();
  await expect(page.getByText("3 parça", { exact: true })).toBeVisible();

  await page.goto("/outfit");
  await page.getByText("Parti", { exact: true }).click();
  await expect(page.getByLabel("Etkinlik")).toHaveValue("Parti");
  await page.getByText("Kombinleri hazırla", { exact: false }).click();
  await expect(page.getByText("6 farklı kombin seçeneği", { exact: true })).toBeVisible();
  await expect(page.getByText("Parti · Minimal seçenek 1", { exact: true })).toBeVisible();
  await expect(page.getByText("4 gardırop parçası kullanıldı", { exact: true }).first()).toBeVisible();
  await page.getByText("Kombin geçmişimi gör", { exact: false }).click();
  await expect(page).toHaveURL(/\\/outfits/);
  await expect(page.getByText("Henüz kaydedilmiş kombinin yok.", { exact: true })).toBeVisible();
});

test("product filtering reaches product detail", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText("80 ürün", { exact: false })).toBeVisible();
  await page.getByLabel("En yüksek bütçe (TL)").fill("2000");
  await page.getByText("Dökümlü Siyah Elbise", { exact: true }).click();

  await expect(page).toHaveURL(/\/product\/p2/);
  await expect(page.getByText("1.890 TL", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Stokta", { exact: false })).toBeVisible();
});

test("virtual try-on demo reaches completion", async ({ page }) => {
  await page.goto("/try-on");
  await page.getByText("Fotoğraf seç", { exact: true }).click();
  await expect(page.getByText("FOTOĞRAF HAZIR", { exact: true })).toBeVisible();
  await page.getByText("Gardırobumdaki parçayı dene", { exact: false }).click();
  await expect(page.getByText("Demo sanal deneme tamamlandı", { exact: false })).toBeVisible();
});

test("saved products require authentication", async ({ page }) => {
  await page.goto("/favorites");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText("Tekrar hoş geldin.", { exact: true })).toBeVisible();
});


test("outfit context filters products and carries try-on selection", async ({ page }) => {
  await page.goto("/products?query=Ayakkabı&budget=1500");
  await expect(page.getByText("Kombinindeki eksik parçaya", { exact: false })).toBeVisible();
  await expect(page.getByText("İnce Topuklu Ayakkabı", { exact: true })).toBeVisible();

  await page.goto("/try-on?wardrobeItemId=demo-dress");
  await expect(page.getByText("DENENECEK PARÇA", { exact: true })).toBeVisible();
  await expect(page.getByText("Kombinden seçilen parça", { exact: true })).toBeVisible();
});
