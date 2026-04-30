import { expect, test } from "@playwright/test";

test("homepage exposes the OS entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "OS Stories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Linux" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "macOS" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Windows" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Mobile" }).first()).toBeVisible();
});

test.describe("os routes", () => {
  test("renders the linux presentation page", async ({ page }) => {
    await page.goto("/linux/");

    await expect(page.getByRole("heading", { level: 2, name: "Linux became the operating system of builders" })).toBeVisible();
  });

  test("renders the macos presentation page", async ({ page }) => {
    await page.goto("/macos/");

    await expect(page.getByRole("heading", { level: 2, name: "The desktop Apple built" })).toBeVisible();
  });

  test("renders the windows article page", async ({ page }) => {
    await page.goto("/windows/");

    await expect(page.getByRole("heading", { level: 1, name: "Windows" })).toBeVisible();
    await expect(page.getByText("The default desktop for most people")).toBeVisible();
  });

  test("renders the mobile presentation page", async ({ page }) => {
    await page.goto("/mobile/");

    await expect(page.getByRole("heading", { level: 2, name: "Computing shrank and intensified" })).toBeVisible();
  });
});