import { test, expect } from "@playwright/test";
import path from "node:path";

const base = process.env.PW_BASE_URL || "http://127.0.0.1:3106";
const evidence = process.env.PW_EVIDENCE_DIR || "tests/evidence";
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: brands, vinyl, responsive layout, multi-step draft and validation`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(20000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Cada historia merece su canción." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-love.png`),
      fullPage: true,
      timeout: 10000,
    });
    const record = page.getByRole("button", {
      name: "Girar vinilo decorativo",
    });
    await expect(record).toHaveAttribute("aria-pressed", "false");
    await record.click();
    await expect(record).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "¿Corazón roto?" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Si te rompieron el corazón, que suene fuerte.",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/rgas$/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: path.join(evidence, `${viewport.name}-heartbreak.png`),
      fullPage: true,
      timeout: 10000,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: "Si te rompieron el corazón, que suene fuerte.",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "¿Te enamoraste?" }).click();
    await page
      .getByRole("button", { name: "Quiero crear una canción" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await dialog.getByRole("button", { name: "Elegir sonido" }).click();
    await expect(page.getByLabel("¿Para quién es?")).toBeVisible();
    await page.getByLabel("¿Para quién es?").fill("José y María");
    await page
      .getByLabel("Cuéntanos su historia")
      .fill(
        "Nos conocimos en Monterrey y nos enamoramos durante una tarde de lluvia.",
      );
    await dialog.getByRole("button", { name: "Elegir sonido" }).click();
    await expect(page.getByLabel("Tipo de voz")).toBeVisible();
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
      timeout: 10000,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: "Quiero crear una canción" })
      .click();
    await expect(page.getByLabel("Tu correo", { exact: true })).toHaveValue(
      "prueba@example.com",
    );
    await expect(page.getByLabel("Tipo de voz")).toHaveValue("Dueto");
    await page.getByRole("button", { name: "← Volver" }).click();
    await expect(page.getByLabel("¿Para quién es?")).toHaveValue(
      "José y María",
    );
    await expect(page.getByLabel("Cuéntanos su historia")).toHaveValue(
      /Monterrey/,
    );
    await expect(page.locator("body")).not.toHaveText(/Internal Server Error/);
    expect(errors).toEqual([]);
    await context.close();
  });
}
test("unauthorized orders and downloads fail closed without database credentials", async ({
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
    const body = await response.text();
    expect(body).not.toMatch(/SUPABASE|service_role|stack|postgres|Missing/);
  }
  const checkout = await request.post(base + "/api/checkout", {
    data: { orderId: order, tier: "premium" },
    headers: { Origin: base },
  });
  expect([401, 403, 404]).toContain(checkout.status());
});

test("approved prototype and implementation use the same fonts and hero geometry", async ({
  browser,
}) => {
  const fs = await import("node:fs/promises");
  const chunks = await fs.readdir(".next/static", { recursive: true });
  let fontCss = "";
  for (const file of chunks.filter((f) => f.endsWith(".css"))) {
    const css = await fs.readFile(
      path.join(".next/static", file),
      "utf8",
    );
    for (const block of css.matchAll(/@font-face\{[^}]+\}/g)) {
      let face = block[0];
      for (const match of face.matchAll(/url\(([^)]+)\)/g)) {
        const bytes = await fs.readFile(
          match[1].startsWith("/_next/") ? path.join(".next",match[1].slice(7)) : path.resolve(path.dirname(path.join(".next/static", file)), match[1].replace(/["']/g, "")),
        );
        face = face.replace(
          match[0],
          `url(data:font/woff2;base64,${bytes.toString("base64")})`,
        );
      }
      fontCss += face;
    }
  }
  const source = (
    await fs.readFile("tests/fixtures/cantalove-prototipo.html", "utf8")
  )
    .replace(/<link[^>]+>/g, "")
    .replace(/<div class="demo-banner">.*?<\/div>/, "");
  const evidenceRows: unknown[] = [];
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const actual = await context.newPage();
    await actual.goto(base, { waitUntil: "domcontentloaded" });
    await actual.evaluate(() => document.fonts.ready);
    const reference = await context.newPage();
    await reference.setContent(source, { waitUntil: "domcontentloaded" });
    await reference.addStyleTag({ content: fontCss });
    await reference.evaluate(() => document.fonts.ready);
    for (const mode of ["love", "heartbreak"]) {
      if (mode === "heartbreak") {
        await actual.getByRole("button", { name: "¿Corazón roto?" }).click();
        await reference.getByRole("button", { name: "¿Corazón roto?" }).click();
      }
      const metrics = async (page: typeof actual) =>
        page.evaluate(() => ({
          fonts: {
            title: document.fonts.check('500 86px "Playfair Display"'),
            body: document.fonts.check('400 17px "DM Sans"'),
          },
          hero: Array.from(
            document.querySelectorAll(
              ".hero, .hero h1, .hero .art, .hero .record, .hero .cover",
            ),
          ).map((el) => {
            const r = el.getBoundingClientRect();
            return {
              class: el.className,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              color: getComputedStyle(el).color,
            };
          }),
        }));
      const actualMetrics = await metrics(actual),
        referenceMetrics = await metrics(reference);
      expect(actualMetrics.fonts).toEqual({ title: true, body: true });
      expect(referenceMetrics.fonts).toEqual({ title: true, body: true });
      await reference.screenshot({
        path: path.join(evidence, `${viewport.name}-prototype-${mode}.png`),
        fullPage: true,
        timeout: 10000,
      });
      await actual.screenshot({
        path: path.join(evidence, `${viewport.name}-${mode}.png`),
        fullPage: true,
        timeout: 10000,
      });
      evidenceRows.push({
        viewport: viewport.name,
        mode,
        actual: actualMetrics,
        reference: referenceMetrics,
      });
      for (let i = 0; i < actualMetrics.hero.length; i++)
        for (const prop of ["x", "y", "width", "height"] as const)
          expect
            .soft(
              Math.abs(
                actualMetrics.hero[i][prop] - referenceMetrics.hero[i][prop],
              ),
              `${viewport.name} ${mode} ${actualMetrics.hero[i].class}.${prop}`,
            )
            .toBeLessThanOrEqual(3);
    }
    await context.close();
  }
  await fs.writeFile(
    path.join(evidence, "visual-metrics.json"),
    JSON.stringify(evidenceRows, null, 2),
  );
});
