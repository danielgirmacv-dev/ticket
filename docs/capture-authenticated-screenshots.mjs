import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "assets", "screenshots");
const BASE = "http://localhost:8080";
const CHROME = "/usr/bin/google-chrome";

async function waitSettled(page, ms = 1500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function takeScreenshot(page, filename) {
  const dest = path.join(OUT, filename);
  await page.screenshot({ path: dest, fullPage: true });
  console.log(`[Captured] ${filename} at ${page.url()}`);
}

async function loginUser(page, email, password) {
  console.log(`Logging in as ${email}...`);
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
  await waitSettled(page, 800);

  const signInTab = page.getByRole("tab", { name: /sign in/i });
  if (await signInTab.count()) {
    await signInTab.first().click();
    await waitSettled(page, 400);
  }

  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]:has-text("Sign In")');

  // Wait for navigation away from /auth
  await page.waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 15000 });
  await waitSettled(page, 2000);
  console.log(`Successfully logged in as ${email}, current URL: ${page.url()}`);
}

async function logoutUser(page) {
  console.log("Logging out and clearing session storage...");
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    const context = page.context();
    await context.clearCookies();
    await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 800);
    console.log("Logged out cleanly.");
  } catch (err) {
    console.warn("Logout error:", err.message);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // ==========================================
  // 1. CAPTURE AS SUPER ADMIN
  // ==========================================
  try {
    await loginUser(page, "superadmin@example.com", "password");

    // Dashboard
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "dashboard-admin.png");

    // Tickets Listing
    await page.goto(`${BASE}/tickets`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "ticket-list.png");

    // Ticket Details
    console.log("Navigating to ticket details...");
    await page.goto(`${BASE}/tickets/019ee527-f5a6-73ff-b023-795dc87795d8`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "ticket-detail.png");

    // Assets Listing
    await page.goto(`${BASE}/assets`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "assets-list.png");

    // Users Management
    await page.goto(`${BASE}/users`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "users-management.png");

    // Reports & Analytics
    await page.goto(`${BASE}/reports`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "reports.png");

    // Calendar
    await page.goto(`${BASE}/calendar`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "calendar.png");

    // Maintenance Schedules
    await page.goto(`${BASE}/schedules`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "schedules.png");

    // Departments
    await page.goto(`${BASE}/departments`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "departments.png");

    // Locations
    await page.goto(`${BASE}/locations`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "locations.png");

    // Knowledge Base / FAQs Admin
    await page.goto(`${BASE}/faqs`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "faqs-admin.png");

    // Activity Logs
    await page.goto(`${BASE}/activity-logs`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "activity-logs.png");

    // In-app Notifications
    await page.goto(`${BASE}/notifications`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "notifications.png");

    // Settings
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "settings.png");

    // Help Center / Support Assistant
    await page.goto(`${BASE}/help`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 1500);
    await takeScreenshot(page, "help-center.png");

    await logoutUser(page);
  } catch (err) {
    console.error("Error during Super Admin capture:", err);
  }

  // ==========================================
  // 2. CAPTURE AS REQUESTER
  // ==========================================
  try {
    await loginUser(page, "requester@example.com", "password");

    // Requester Requests / Ticket Submission View
    await page.goto(`${BASE}/requests`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "requests-requester.png");

    // Requester Dashboard (or requests view if redirected)
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "dashboard-requester.png");

    await logoutUser(page);
  } catch (err) {
    console.error("Error during Requester capture:", err);
  }

  // ==========================================
  // 3. CAPTURE AS TECHNICIAN
  // ==========================================
  try {
    await loginUser(page, "technician@example.com", "password");

    // Technician Dashboard
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "dashboard-technician.png");

    // Technician Assigned Tickets
    await page.goto(`${BASE}/tickets`, { waitUntil: "domcontentloaded" });
    await waitSettled(page, 2000);
    await takeScreenshot(page, "technician-tickets.png");

    await logoutUser(page);
  } catch (err) {
    console.error("Error during Technician capture:", err);
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
