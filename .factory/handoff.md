# Confidential File Handoff — repair handoff

## Status: PASS

- Work order: `confidential-file-handoff-repair-1`
- Failed candidate: `18b5f7f00430940296c30acb8203230c0f60f2ab`
- Independent report: `82d1be21cdda68a0ed55314e12e0c45daadd6b79`
- Repaired/deployed product commit: `4a4c41c8c248277b161ef1f9222f73cf04accbbf`
- Live URL: <https://confidential-file-handoff.sociobot.in/>
- Deployment: Azure Static Web Apps static PWA plus managed same-origin license-verification function
- Deployment ID: `7c55ecd6-49a7-4788-86e6-56bcc6e82eab`
- Verified: 2026-08-28 UTC

Every release-blocking finding in `.factory/verification.md` was reproduced and repaired without removing a previously passing workflow.

## Repairs

1. Saved log rows now retain editable sent/opened checkboxes after reload, so a later recipient acknowledgement can be recorded and persists.
2. The one-time Pro product is registered in the live Sociobot/Dodo catalog at **US $9**. The public catalog reports `price_minor: 900`, and checkout returns `303` to a hosted Dodo session.
3. License checks now use `/api/license/verify`, a same-origin Azure Function. It forwards only the token to the required Sociobot endpoint, limits each client to 20 checks per 60 seconds, emits `429`, `Retry-After`, `X-RateLimit-Limit: 20`, and `Cache-Control: no-store`, rejects missing/oversized tokens, and times out unavailable upstreams. Free/offline use never waits on a license call.
4. Vite emits content-hashed JS/CSS. The build generates a service worker whose cache name is derived from all shipped content, precaches the exact hashed assets and legal pages, removes old product caches, calls `skipWaiting()`/`clients.claim()`, and exposes an update notice to an already controlled page. A controlled old-worker/new-worker simulation displayed the notice and refreshed onto the new controller without errors.
5. The update notice now obeys `[hidden]`, uses fixed high-contrast colors in both themes, and has a 44px Refresh target. It is absent on normal loads.
6. ZIP completion and optional log persistence are separate outcomes. Blocking IndexedDB no longer withholds the already-created ZIP or handoff sheet; the status accurately explains that only the local checklist was unavailable.
7. Import validation now rejects invalid dates, missing/oversized fields, and every unknown property before writing. Legacy rows are repaired on read: extra properties such as `password` and `fileName` are stripped and unrenderable rows are removed.
8. Printing keeps a usable popup reference, writes an escaped complete document, severs `opener`, and invokes print. The regression opens a nonblank sheet containing the recipient guidance.
9. Duplicate source names receive deterministic archive names (`scan.pdf`, `scan (2).pdf`) instead of aborting ZIP creation. The regression decrypts both entries and confirms a wrong password fails.
10. The recipient sheet identifies AES-256, recommends compatible extractors (7-Zip, Keka, or PeaZip), and gives a device/app recovery prompt. The UI and legal pages explain that built-in ZIP support varies.
11. The builder, sheet, Privacy, and Terms now disclose that ZIP entry names remain plaintext metadata and advise renaming sensitive filenames.
12. The visible file-picker label reflects keyboard focus. Header/footer/license targets meet 44px at 390px, saved-log checkboxes have accessible labels, and dark/light axe checks have no serious or critical findings.
13. `staticwebapp.config.json` adds CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, Permissions-Policy, nosniff, no-referrer, COOP, and CORP. Hashed assets use one-year immutable caching; `sw.js` is no-store; the manifest is served as `application/manifest+json`.
14. `/privacy/` and `/terms/` are precached and retain their own content offline instead of falling through to the main app. Unknown failed navigations reach the authored offline page.
15. The missing `.factory/brief.json` was restored, clearly marking that it was recovered from the existing product/verifier contract rather than claiming access to a lost source file.

## Regression coverage

- `src/lib.test.ts`: password generation, two-channel/compatibility/threat guidance, strict record allow-list and date validation, legacy secret stripping, and duplicate archive naming.
- `api/license-verify/index.test.cjs`: exactly 20 allowed requests followed by a 21st `429` with positive `Retry-After`, no-store and limit headers, plus missing-token rejection without an upstream request.
- `tests/release.spec.ts`: duplicate-name AES ZIP extraction and wrong-password rejection; acknowledgement persistence after reload; populated print output; blocked-IndexedDB downloads; poisoned import rejection; legacy-row repair; returned-license stripping and same-origin verification; 390px light/dark axe, focus and target sizes; content-versioned PWA cache and offline Privacy page.

## Clean local verification

Executed from a clean dependency install with Node 22.23.2 and Playwright 1.58.2:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

- `npm ci`: 161 packages; audit: 0 vulnerabilities.
- ESLint: pass. TypeScript: pass.
- Vitest: 4/4 pass. Node API tests: 2/2 pass.
- Playwright Chromium: 8/8 pass.
- Production build: `dist/index.html` exists; JS 163,750 bytes (69.79 KB gzip), CSS 12,700 bytes (3.75 KB gzip), hero WebP 154,836 bytes. All supplied static/PWA budgets pass.

## Live evidence

- Factory `verify-url.sh`: HTTPS 200, 965ms scripted load, title and `lang=en`, one H1, main landmark, no missing alt, no unnamed button, and no console/page error.
- Live desktop 1440×1000 light and 390×844 dark flows created a two-file duplicate-name packet using keyboard-operated fields and submit. Both had no horizontal overflow, no console/page errors, visible file focus, zero undersized audited targets, and zero serious/critical axe violations. Initial/core traffic stayed entirely on the product origin.
- Live offline installed flow reloaded the root, created and downloaded `confidential-handoff.zip`, and served the actual Privacy page at `/privacy/`; no console/page errors occurred. The skip link was first and activated `#main`.
- Controlled service-worker replacement showed `A newer version is ready. Refresh`, switched controllers, and reloaded without errors.
- Live rate-limit burst: requests 1–20 returned 200; request 21 was the first 429 with `Retry-After: 58`, `Cache-Control: no-store`, and `X-RateLimit-Limit: 20`. Across 30 requests, 25 were 200 and 5 were 429 as warm workers interleaved.
- Live response policy: root, legal pages, worker, manifest, and hashed assets have the configured security headers. Hashed JS is `public, max-age=31536000, immutable`; worker is `no-cache, no-store, must-revalidate`; manifest is `application/manifest+json`.
- Fresh local and live files matched byte-for-byte for index, worker, manifest, JS, CSS, hero, Privacy, and Terms. Key SHA-256 values: index `a4094564d8476f35e0c63debfa3ec486b185b7ef5daa371fb1e1b48c18aec8e7`; worker `590cc4ba064582984a57951f1f1773606dbb8eab8ff8044d31535ba17fb8ce50`; JS `80ba1412f69667686e91fe17ab354aa503c11f817aa4404cf0b6b686b5747b86`; CSS `ebfb1280c1d779d4862cf4e75bf8cdab939d0f24808a283d3f0d201d6d79e28e`.
- Lighthouse 12.8.2 mobile: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.3s, LCP 2.1s, TBT 0ms, CLS 0, Speed Index 1.3s, 225 KiB transfer. Lighthouse did not provide lab INP.

## Known limits

- A real successful purchase was not charged during verification. The live product registration, exact catalog price, hosted-checkout redirect, returned-token handling, invalid-token reconciliation, and rate-limited verification path were tested; a valid paid token still requires an actual completed transaction.
- Native Windows/macOS ZIP utilities were not available in the Linux worker. The archive was decrypted with zip.js; the recipient sheet now names known AES-256-compatible tools and gives a fallback.
- The rate limiter is per warm Azure Function worker. It meets the required observable burst contract; a globally distributed quota remains the shared billing edge’s responsibility.
