# Polish round 3 handoff — Confidential File Handoff

## Outcome

Released repair build `479e2c68a16b1eb5bef7878990daef935d515a6c` is live at <https://confidential-file-handoff.sociobot.in/>. The live footer identifies build `479e2c6` on root, legal routes, Offline, and 404.

The repair closes every finding in reviews 1–3. The complete mapping is in `.factory/polish-3.md`.

## What changed

- Made the complete first-screen action and all three facts fit at 1366 × 768 while preserving the halftone print-desk design.
- Kept the direct, isolated `/?demo=1` Maya sample path with its persistent banner, reset, and real-mode exit.
- Added three concrete claim tests for license-token handling, log deletion after reload, and browser site-data clearing; `.factory/claims.json` now has 28 uniquely tagged claims.
- Moved the browser license check to a same-origin JSON POST, removed the token from the request URL, and updated the managed function to accept only POST requests.
- Completed the Offline and 404 route shells, including metadata, PWA links, focus restoration, announcements, shared footer/build ID, mobile coverage, link crawl, and live axe coverage.
- Rewrote every round-three copy issue in the product, Privacy page, README, catalog description, and copy audit.

## Exact verification

Final clean GitHub clone: commit `479e2c6`, installed with `npm ci`.

- Ran every one of the 28 commands listed in `.factory/claims.json` independently: **28/28 passed**. The 25 browser claims each ran from a clean production server; the three gateway claims ran by their exact `node --test --test-name-pattern` command. Tag uniqueness audit: **28/28**.
- `npm test`: **4 Vitest + 10 gateway tests passed**.
- `npm run lint`, `npm run typecheck`, and `npm run build`: passed. `dist/index.html` exists.
- `npm run test:browser`: **39/39 passed**. Coverage includes AES-256 archive validation, wrong/missing phrase rejection, demo isolation/reset/exit, local storage fields/import/export/delete/clear, PWA offline reload, route metadata and 404, focus announcements, link crawl, mobile/touch/focus states, axe, and no third-party core-flow requests.
- Final bundle: JavaScript 71.32 KB gzip; CSS 4.26 KB gzip.
- `/opt/fleet/lib/verify-url.sh https://confidential-file-handoff.sociobot.in/ .factory/evidence/polish-3-live-final-root`: passed with HTTP 200, title/lang/main/h1/alt/button checks, and zero console errors. See [report](evidence/polish-3-live-final-root/verify.json).
- Cold live browser audit: root action/facts finish at 659/728 px in a 1366 × 768 viewport; `/?demo=1` controls and sample are inside the first 390 × 844 viewport; its request log remained same-origin/blob only; reset cleared the demo log.
- Live license boundary: a same-origin POST body check returned 200 without the token in its URL. The deployed function response has `Cache-Control: no-store` and rate-limit headers.
- Live Privacy, Terms, Offline, and actual 404: exact titles, complete metadata, one h1/main, shared build footer, and zero serious/critical WCAG 2 A/AA axe violations. Offline → Privacy moves focus to the Privacy h1.
- Live mobile Lighthouse: **99 performance, 100 accessibility, 100 best practices, 100 SEO**; FCP 1.292 s, LCP 2.117 s, CLS 0, TBT 84 ms. See [Lighthouse JSON](evidence/polish-3-live-lighthouse.json).

## Deploy

Built and deployed through the static work-order configuration:

```sh
npm ci && npm test && npm run build
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

The managed `/api/license/verify` function was deployed with the static app.

## Known gaps and next steps

None known. The product remains a local-first PWA: it does not upload files, and Pro license checks are the only optional network path.
