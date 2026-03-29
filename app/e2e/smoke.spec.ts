import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/OpsManager/i);
    // Should have email and password inputs
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "admin@skypro360.es");
    await page.fill('input[name="password"], input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    // Should redirect to dashboard
    await page.waitForURL("/", { timeout: 10_000 });
    // Dashboard should show "Mapa de Operaciones"
    await expect(page.locator("text=Mapa de Operaciones")).toBeVisible({ timeout: 10_000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "bad@example.com");
    await page.fill('input[name="password"], input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authenticated Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"], input[type="email"]', "admin@skypro360.es");
    await page.fill('input[name="password"], input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("dashboard loads with stats bar", async ({ page }) => {
    await expect(page.locator("text=Mapa de Operaciones")).toBeVisible();
    await expect(page.locator("text=En vuelo")).toBeVisible();
    await expect(page.locator("text=Planificadas")).toBeVisible();
    await expect(page.locator("text=Completadas")).toBeVisible();
  });

  test("missions page loads", async ({ page }) => {
    await page.goto("/missions");
    await expect(page.locator("text=Misiones")).toBeVisible({ timeout: 10_000 });
  });

  test("drones page loads", async ({ page }) => {
    await page.goto("/fleet/drones");
    await expect(page.locator("text=Drones")).toBeVisible({ timeout: 10_000 });
  });

  test("pilots page loads", async ({ page }) => {
    await page.goto("/fleet/pilots");
    await expect(page.locator("text=Pilotos")).toBeVisible({ timeout: 10_000 });
  });
});
