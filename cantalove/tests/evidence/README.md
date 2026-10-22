# Cantalove verification evidence

- Unit/SQL/provider-mock tests: 38 passed, 0 failed. `unit-tests.txt`.
- Browser tests against optimized production build: 4 passed, 0 failed. `browser-tests.txt`, `playwright-results.json`.
- Approved HTML vs implementation: all 80 hero geometry measurements match exactly (0 CSS-pixel maximum deviation). Viewports: 1440×1000 and 390×844, both brands. `visual-metrics.json`.
- Font comparison uses the exact locally bundled Playfair Display and DM Sans font faces in both the approved HTML reference and implementation. Both fonts were loaded before captures. The prototype-only banner is removed for fair layout comparison. Pricing/legal/availability copy intentionally reflects implemented capabilities, not demo-only sales promises.
- `*-before-main.png`: actual previous main code built separately from git archive.
- `*-prototype-*.png`: approved HTML reference using matching local fonts.
- `desktop-love.png`, `mobile-love.png`, `desktop-heartbreak.png`, `mobile-heartbreak.png`: implementation.
- `*-form.png`: third personalization step with synthetic sample data only.
- This Linux browser environment lacks a color-emoji font. Some decorative emoji appear as missing-glyph boxes in both reference and implementation; this is an environment limitation and needs checking on real iOS/Android devices before release.

Reproduce after `npm ci` and `npm run build`:

```sh
node --conditions=react-server --import tsx --test tests/*.test.ts
node tests/run-ui.mjs
```

Install the matching Playwright browser normally (`npx playwright install chromium`). This environment's browser CDN returned HTML rather than a ZIP; the successful fallback used a temporary npm-distributed Chromium binary with SwiftShader libraries, selected by `PW_CHROMIUM_PATH`. No browser binary or fallback package was added to application dependencies.

The successful browser test run used an isolated optimized webpack build copied from the current source to avoid concurrent `.next` writes by other tasks. The regular Next build also passed. Earlier shared-build manifest errors did not reproduce under isolated verification.

No real song generation, real Resend delivery, provider-account licensing verification, or Mercado Pago sandbox purchase was completed by these tests. Provider events/payments in unit tests are explicitly mocked. Anonymous download/listen access was denied by actual HTTP handlers.
