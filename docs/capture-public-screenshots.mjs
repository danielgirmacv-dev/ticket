import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "assets", "screenshots");
const BASE = "http://localhost:8080";
const CHROME = "/usr/bin/google-chrome";

const PROTECTED = [
  "/",
  "/tickets",
  "/tickets/sample-id",
  "/requests",
  "/assets",
  "/calendar",
  "/help",
  "/settings",
  "/notifications",
  "/users",
  "/locations",
  "/departments",
  "/faqs",
  "/activity-logs",
  "/schedules",
  "/reports",
];

async function waitSettled(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

async function screenshot(page, name) {
  const dest = path.join(OUT, name);
  await page.screenshot({ path: dest, fullPage: true });
  console.log(`saved ${dest} url=${page.url()}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const health = await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  console.log(`GET ${BASE}/ status=${health?.status()} final=${page.url()}`);
  await waitSettled(page);

  if (page.url().includes("/auth")) {
    await page.getByRole("tab", { name: /sign in/i }).click().catch(() => {});
    await waitSettled(page);
    await screenshot(page, "login.png");

    const registerTab = page.getByRole("tab", { name: /create account|register|sign up/i });
    if (await registerTab.count()) {
      await registerTab.first().click();
      await waitSettled(page);
      await screenshot(page, "register.png");
    }
  } else {
    await screenshot(page, "login.png");
  }

  await page.goto(BASE + "/auth", { waitUntil: "domcontentloaded" });
  await waitSettled(page);
  await screenshot(page, "auth-sign-in.png");

  const redirects = [];
  for (const route of PROTECTED) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await waitSettled(page);
    redirects.push({
      requested: route,
      final: page.url(),
      requiresAuth: new URL(page.url()).pathname === "/auth",
    });
  }

  await page.goto(BASE + "/this-page-does-not-exist", { waitUntil: "domcontentloaded" });
  await waitSettled(page);
  console.log(`unknown-route final=${page.url()}`);
  await screenshot(page, "not-found.png");

  console.log("PROTECTED_ROUTE_CHECK");
  console.log(JSON.stringify(redirects, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
