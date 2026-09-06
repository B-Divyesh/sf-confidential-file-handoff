# Create and hand off protected files — verification 8

**Verdict: PASS**

**Findings:** 0

**Untested claims:** 0

**Implementation reviewed:** `7a64d7668af332bcb2cc794beb098bebc0252fd7`

**Documentation baseline:** `1ee2db95ca832e22ae35159d806d44dd2b00011a`

**Live URL:** <https://confidential-file-handoff.sociobot.in/>

**Verified:** 2026-09-06 UTC

**Work order:** `confidential-file-handoff-verify-8`

The release candidate passes with zero findings at every severity. All 28 declared claims were run from a clean checkout and passed. No public claim remains unlisted or untested.

## Job, audience, and first action

Fresh Chromium contexts were opened at 1366 × 768 and 390 × 844 before scrolling.

- **Job:** Create a protected ZIP and give the recipient clear opening instructions.
- **Audience:** People sending personal files to recipients who need separate steps for opening them.
- **First action:** **Try it with sample data**, which opens Maya’s filled sample handoff.

The exact headline is “Create a protected ZIP with opening instructions.” The action and all three privacy, offline, and price facts fit before scrolling. Their bottom edge was 728 px on desktop and 678 px on phone.

## Declared claims

A detached clean checkout at documentation SHA `1ee2db9` used Node 22.23.2, npm 10.9.8, and the documented `npm ci`. Every exact command in `.factory/claims.json` was then run separately.

| Claim | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `demo-reset` | PASS |
| `demo-exit-discard` | PASS |
| `encrypted-local-zip` | PASS |
| `zip-entry-names-visible` | PASS |
| `handoff-sheet-compatibility` | PASS |
| `no-recipient-verification` | PASS |
| `offline-after-first-visit` | PASS |
| `handoff-sheet-routes` | PASS |
| `local-log-fields` | PASS |
| `local-log-export` | PASS |
| `local-log-import` | PASS |
| `local-log-delete` | PASS |
| `site-storage-clear` | PASS |
| `access-phrase-excluded` | PASS |
| `no-sensitive-uploads` | PASS |
| `free-core-tools` | PASS |
| `pro-price` | PASS |
| `pro-note-entitlement` | PASS |
| `payment-provider-boundary` | PASS |
| `revoked-license-lock` | PASS |
| `license-cache-ttl` | PASS |
| `license-token-handling` | PASS |
| `license-rate-limit` | PASS |
| `license-response-no-store` | PASS |
| `license-rate-storage-minimal` | PASS |
| `no-third-party-runtime` | PASS |
| `artwork-provenance` | PASS |

The 28 claim IDs each occur in exactly one tagged test. I also reviewed the live landing, Privacy, Terms, README, demo notes, and design notes. Their security, storage, offline, payment, compatibility, price, and artwork statements are covered by these claims. Untested claim count: **0**.

## Clean checkout quality gates

```text
npm ci                 PASS; 188 packages, 0 vulnerabilities
npm test               PASS; 4 Vitest tests and 10 gateway tests
npm run lint           PASS
npm run typecheck      PASS
npm run build          PASS; dist/index.html produced
npm run test:browser   PASS; 41/41 Chromium tests
```

The build contains 171,688 bytes of JavaScript, 15,180 bytes of CSS, and no web-font download. JavaScript and CSS remain inside the product budgets.

## Live desktop, phone, and demo checks

- One click opened `/?demo=1`. The first phone viewport showed the persistent **Demo — sample data, nothing is saved** label, Maya, `project-update.txt`, `meeting-notes.txt`, both delivery routes, and **Create sample handoff**.
- A synthetic real-mode record was created before entering demo. Demo create and reset did not change it. Reset hid the prepared result, cleared the demo log, and restored both shipped sample files. **Start for real** cleared the demo log; the synthetic real record remained.
- Desktop and dark/reduced-motion phone output kept the repaired **Download handoff sheet** visible and accessible label. Its fixed dark panel used warm text on a near-black background.
- The downloaded ZIP used `confidential-file-handoff.zip`. Duplicate `scan.pdf` inputs became `scan.pdf` and `scan (2).pdf`. Both entries were encrypted with WinZip AES strength 3. The correct 12-character boundary phrase decrypted both; a wrong phrase failed.
- The downloaded sheet used `confidential-file-handoff.txt`. It named the ZIP, both selected routes, 7-Zip, Keka, PeaZip, and the failure-report step. It contained neither the phrase nor the source filename.
- Sent and opened status survived two reloads. A secret-bearing invalid import was rejected without changing the valid row.
- Empty submission announced one corrective status, supplied field-specific errors, and focused the file picker. The 80-character recipient, zero-byte file, 1 MiB file, duplicate names, and 12-character phrase boundaries completed successfully.
- Core create, download, reload, and recovery traffic stayed on the product origin. No page or console error occurred.

## Accessibility, routes, links, and PWA

- `verify-url.sh` passed the live Root, Demo, Privacy, Terms, and Offline pages: HTTPS 200, `lang=en`, one h1, one main landmark, labelled buttons, alt coverage, and no load errors.
- Live axe on the populated dark/reduced-motion phone state found zero violations. The full suite also covers the light and dark themes, legal pages, 404, mobile touch targets, form error links, keyboard order, and focus.
- The first Tab stop was the visible skip link with a 3 px gold focus ring. Reduced motion produced `scroll-behavior: auto` and zero-second button transitions. The 390 px layout had no horizontal overflow.
- Root, Demo, Privacy, Terms, and Offline returned their exact route titles, one h1, common navigation, main, footer, and no phone overflow.
- `/qa-deliberate-missing-page` intentionally returned HTTP 404 with the designed “That page is not here.” page and working return actions. This expected status is not a defect.
- Every rendered product link returned 200. The checkout resolved to the hosted Dodo page through Sociobot, and Sociobot support returned 200. The missing page’s own skip link retained the expected 404.
- After service-worker control, the phone reloaded demo offline and created the sample handoff. A local old-to-current build simulation displayed **Load the new version**, activated the new worker, removed the old cache, loaded the current hashed CSS, and reported no errors.
- Root responses carried CSP with `frame-ancestors 'none'`, no-referrer, nosniff, frame denial, COOP/CORP, and Permissions-Policy. Hashed JavaScript used one-year immutable caching; the worker used `no-store`; the manifest had the correct media type.

Fresh mobile Lighthouse results were Performance 97, Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.3 s, LCP 2.1 s, CLS 0, and TBT 140 ms. The performance score varies slightly from the previous 99 but remains above the required 90 with all stated timing budgets passing.

## Live gateway allowance and server scope

Using one new client identity, 21 sequential live POST requests were sent to `/api/license/verify` with an invalid test token. Requests 1–20 returned 200 with remaining allowance counting 19 to 0 and `Cache-Control: no-store`. Request 21 returned 429, `Retry-After: 58`, remaining 0, and `reason: rate_limited`.

An earlier fresh-client recovery run received four `503 unavailable` responses with `Retry-After: 60` before the upstream service recovered. Its allowance still counted down and request 21 still returned 429. The separate confirmation above passed 20 normal responses followed by the required limit. The transient responses are not a defect: the gateway returned its documented fail-soft shape, the client recovery path is tested, and the product makes no uptime promise.

This product is a static, local-first PWA. It has no tenant database, server-side product records, or health route, so tenant isolation and backend restart persistence do not apply. User records persist in the browser and were verified across reload. The only server function is the checked license gateway; no credential was read or logged.

## Live candidate comparison

The clean production build and live deployment have identical SHA-256 values for `index.html`, `main-DaRvjJ_5.js`, `main-GUSyI-4G.css`, and `sw.js`. Commits after `7a64d76` contain documentation and evidence only, so the reviewed implementation is the current live product image.

## Earlier findings

| Earlier report | Current disposition |
| --- | --- |
| Verification 1: delayed status, print, duplicate names, storage/import recovery, compatibility, focus, touch size, dark contrast, PWA update, headers, checkout, rate limit, metadata | Closed. Normal and boundary output, delayed status, print and storage regressions pass in the 41-test suite. Live dark axe, touch/focus, offline/update, headers, checkout, and rate checks pass. |
| Verification 2: missing claims/demo, weak first screen, paid token race/cache, form associations, routing, copy audit, title/footer | Closed. There are 28 unique claims; the isolated sample and first screen pass; entitlement/cache tests pass; forms, routes, copy audit, titles, and footer pass. |
| Verification 3: paid race, missing claims, retained demo data, long copy, route/social metadata, footer/build and asset caching | Closed. Exact entitlement tests pass; demo reset/exit preserves real data; current copy and 1200 × 630 social metadata are present; live footer has a build ID; hashed assets are immutable. |
| Verification 4: live rate limit, paid race, missing public claims, retained demo records | Closed. Live request 21 is 429 with `Retry-After`; paid and demo claims pass. |
| Verification 5: clean root install omitted API dependencies | Closed. `npm ci` installed the workspace; root tests and all gateway claims passed from the detached checkout. |
| Verification 6: live gateway 500, wrong ZIP name and broken sheet wording, weak first screen, dead footer link | Closed. Live gateway, downloaded sheet, first screen, and every rendered link pass. |
| Verification 7: inconsistent route titles and 900 × 600 social image | Closed. All live route titles use Confidential File Handoff and metadata points to the 1200 × 630 product image. |
| Reviews 1–3: demo placement, unlisted/weak claims, route shell, dead link, copy and README terms, desktop first action, offline route | Closed. Fresh first-screen measurements, claim completeness, live route matrix, link crawl, copy review, and offline checks pass. |
| Review 5 F-5-1: handoff-sheet download button lost its label | Closed. The label is **Download handoff sheet** after creation on desktop and dark phone, and the download works. |
| Repair 6 dark prepared-state issue | Closed. The prepared dark phone state has readable fixed colors and zero axe violations. |

Review 4 already reported no findings. No earlier minor item remains open.

## Evidence

Evidence is in `.factory/evidence/verification-8/`: live workflow JSON and screenshots, update simulation, five `verify-url.sh` runs, route/link/header checks, both live allowance runs, deployment hashes, and Lighthouse JSON.

**Final result: PASS — 0 findings, 0 untested claims.**
