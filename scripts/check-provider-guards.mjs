import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const tryOn = read("supabase/functions/try-on/index.ts");
const classify = read("supabase/functions/classify-garment/index.ts");
const catalog = read("supabase/functions/catalog-sync/index.ts");
const env = read(".env.example");

const checks = [
  [tryOn.includes('PAID_PROVIDERS_ENABLED") !== "true"'), "try-on paid-provider guard"],
  [classify.includes('PAID_PROVIDERS_ENABLED") !== "true"'), "classification paid-provider guard"],
  [catalog.includes('OFFICIAL_CATALOG_ENABLED") !== "true"'), "official catalog guard"],
  [tryOn.includes('?? "mock"'), "try-on defaults to mock"],
  [classify.includes('?? "mock"'), "classification defaults to mock"],
  [catalog.includes('?? "mock"'), "catalog defaults to mock"],
  [!env.includes("sk-") && !env.includes("service_role="), "example environment contains no secrets"],
];
const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  console.error("Provider guard checks failed:", failed.map(([, name]) => name).join(", "));
  process.exit(1);
}
console.log("Provider guards verified.");

