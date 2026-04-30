import { expect, test } from "@playwright/test";

test("homepage combines every chapter into one scroll story", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "OS Stories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Linux" })).toBeVisible();
  await expect(page.getByRole("link", { name: "macOS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Windows" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mobile" })).toBeVisible();
  await expect(page.getByTestId("presentation-progress")).toBeAttached();

  await page.locator("body").press("Space");
  await expect(page.getByTestId("chapter-linux")).toBeInViewport();

  await page.locator("body").press("Space");
  await expect(page.getByRole("heading", { level: 2, name: "Linux became the operating system of builders" })).toBeInViewport();

  await page.getByRole("link", { name: "Windows" }).click();
  await expect(page.getByTestId("chapter-windows")).toBeInViewport();
  await expect(page.locator('img[src*="windows-hero.svg"]')).toHaveCount(1);
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
      .getByText("Welcome to OS Stories. The chapters that used to live on separate pages now run as one continuous document.")
      .locator("..");

    await expect.poll(async () => paragraphParent.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  });
});