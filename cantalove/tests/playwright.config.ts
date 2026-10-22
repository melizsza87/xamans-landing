import path from "node:path";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "ui.spec.ts",
  timeout: 90000,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: path.resolve(process.env.PW_EVIDENCE_DIR || "tests/evidence", "playwright-results.json") }],
  ],
  use: {
    headless: true,
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? {
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
        }
      : {},
  },
});
