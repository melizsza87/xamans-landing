import { test, expect } from "@playwright/test";
import path from "node:path";
const base = process.env.PW_BASE_URL || "http://127.0.0.1:3106";
const evidence = process.env.PW_EVIDENCE_DIR || "tests/evidence/mockup-v2";
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
  { name: "reference-width", width: 684, height: 1024 },
]) {
  test(`${viewport.name}: approved photo direction, brand switch, form and draft`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#campaign-title")).toContainText("La canción");
    await expect(page.locator("#campaign-title")).toContainText("regalarle");
    await expect(page.locator(".campaign-photo img")).toHaveAttribute(
      "src",
      "/images/cantalove-hero.webp",
    );
    expect(
      await page
        .locator(".campaign-photo img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
    await expect(page.locator(".campaign-photo-card")).toHaveCount(4);
    for (const card of await page.locator(".campaign-package").all()) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-love.png`),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-love-first-screen.png`),
      fullPage: false,
    });
    await page
      .getByRole("button", { name: "Ir a Cantalovergas", exact: true })
      .click();
    await expect(page).toHaveURL(/\/rgas$/);
    await expect(page.locator("#campaign-title")).toContainText("Despecho");
    await expect(page.locator(".campaign-photo img")).toHaveAttribute(
      "src",
      "/images/cantalovergas-hero.webp",
    );
    await expect(page.locator(".campaign-note-card")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Ex tóxico/ })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-heartbreak.png`),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-heartbreak-first-screen.png`),
      fullPage: false,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#campaign-title")).toContainText("Despecho");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      page.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ir a Cantalove", exact: true })
      .first()
      .click();
    await page.locator(".campaign-hero-cta").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await dialog.getByRole("button", { name: "Elegir sonido" }).click();
    await expect(page.getByLabel("¿Para quién es?")).toBeVisible();
    await page.getByLabel("¿Para quién es?").fill("José y María");
    await page
      .getByLabel("Cuéntanos su historia")
      .fill(
        "Nos conocimos en Monterrey y una tarde de lluvia cambió nuestra historia.",
      );
    await dialog.getByRole("button", { name: "Elegir sonido" }).click();
    await page.getByLabel("Tipo de voz").selectOption("Dueto");
    await page
      .getByLabel("Tu correo", { exact: true })
      .fill("prueba@example.com");
    await expect(
      dialog.getByRole("button", { name: "Generar mi canción" }),
    ).toBeDisabled();
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-form.png`),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".campaign-hero-cta").click();
    await expect(page.getByLabel("Tipo de voz")).toHaveValue("Dueto");
    await expect(page.getByLabel("Tu correo", { exact: true })).toHaveValue(
      "prueba@example.com",
    );
    await dialog.getByRole("button", { name: "← Volver" }).click();
    await expect(page.getByLabel("¿Para quién es?")).toHaveValue(
      "José y María",
    );
    expect(errors).toEqual([]);
    await context.close();
  });
}
test("private audio and downloads remain denied for anonymous visitors", async ({
  request,
}) => {
  const order = "8bcefd53-1e0a-4a9f-b4df-ab121d92e3c1";
  for (const endpoint of [
    `/api/download/${order}`,
    `/api/download/${order}/lyrics`,
    `/api/listen/${order}`,
  ]) {
    const response = await request.get(base + endpoint);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toMatch(
      /SUPABASE|service_role|stack|postgres|Missing/,
    );
  }
  const checkout = await request.post(base + "/api/checkout", {
    data: { orderId: order, tier: "premium" },
    headers: { Origin: base },
  });
  expect([401, 403, 404]).toContain(checkout.status());
});
