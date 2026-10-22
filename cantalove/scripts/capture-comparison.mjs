// Side-by-side composition of actual browser captures; no generated imagery.
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const directory = "tests/evidence/mockup-v2";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM_PATH,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--in-process-gpu",
    "--no-zygote",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1100 },
    deviceScaleFactor: 1,
  });
  const images = await Promise.all(
    ["love", "heartbreak"].map(
      async (brand) =>
        "data:image/png;base64," +
        (
          await readFile(
            `${directory}/reference-width-${brand}-first-screen.png`,
          )
        ).toString("base64"),
    ),
  );
  await page.setContent(
    `<html><head><style>*{box-sizing:border-box}body{margin:0;background:#ede6da;display:flex;justify-content:center;align-items:flex-start;gap:48px;padding:32px 36px}.panel{width:696px;height:1036px;border:6px solid #111;border-radius:58px;overflow:hidden;box-shadow:0 10px 20px #0004;flex:none}.panel img{display:block;width:684px;height:1024px}</style></head><body>${images.map((src) => `<div class="panel"><img src="${src}"></div>`).join("")}</body></html>`,
  );
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  await page.screenshot({ path: `${directory}/comparacion-actual.png` });
} finally {
  await browser.close();
}
