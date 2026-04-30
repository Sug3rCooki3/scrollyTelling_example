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
    await expect(page.getByTestId("presentation-progress")).toBeAttached();
    await expect(page.locator('img[src*="linux-split.svg"]')).toHaveCount(1);
  });

  test("renders the macos presentation page", async ({ page }) => {
    await page.goto("/macos/");

    await expect(page.getByRole("heading", { level: 2, name: "The desktop Apple built" })).toBeVisible();
  });

  test("renders the windows article page", async ({ page }) => {
    await page.goto("/windows/");

    await expect(page.getByRole("heading", { level: 1, name: "Windows" })).toBeVisible();
    await expect(page.getByText("The default desktop for most people")).toBeVisible();
    await expect(page.locator('img[src*="windows-hero.svg"]')).toHaveCount(1);
    await expect(page.getByTestId("presentation-progress")).toHaveCount(0);
  });

  test("renders the mobile presentation page", async ({ page }) => {
    await page.goto("/mobile/");

    await expect(page.getByRole("heading", { level: 2, name: "Computing shrank and intensified" })).toBeVisible();
    await expect(page.locator('img[src*="mobile-split-reverse.svg"]')).toHaveCount(1);
  });

  test("presentation progress responds to page scroll", async ({ page }) => {
    await page.goto("/linux/");

    const progressBar = page.getByTestId("presentation-progress");
    await expect(progressBar).toBeAttached();

    const before = await progressBar.evaluate((element) => getComputedStyle(element).transform);
    await page.mouse.wheel(0, 1400);
    await expect
      .poll(async () => progressBar.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(before);
  });
});

test.describe("reduced motion", () => {
  test("renders article content without motion wrapper styles", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const paragraphParent = page
      .getByText("Welcome to OS Stories. Explore the operating systems that shaped computing.")
      .locator("..");

    await expect
      .poll(async () => paragraphParent.getAttribute("style"))
      .toContain("opacity: 1");
  });
});