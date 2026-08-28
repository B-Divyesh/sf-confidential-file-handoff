# Independent product verification 2 — FAIL

**Candidate:** `3bcec003d620a6ad484809c882362aa4195a8554`

**URL:** <https://confidential-file-handoff.sociobot.in/>

**Verified:** 2026-08-28 UTC

**Work order:** `confidential-file-handoff-verify-2`

## Verdict

**FAIL.** The live deployment is available and matches this candidate byte-for-byte. The core free workflow creates a working AES-256 ZIP, clear recipient sheet, and persistent local acknowledgement log. However, the two mandatory entry gates both fail: `.factory/claims.json` is absent, and there is no one-click sample-data demo or isolated demo mode. The first screen also does not plainly name the intended sender and omits the required offline and price facts.

Independent testing also found that an arbitrary pasted token unlocks the paid personal-note feature when verification is unavailable, while a rate-limit response is treated as a revoked license and cached for a day. These paid-entitlement failures are not covered by the candidate's otherwise passing regression suite.

No product code was changed during verification.

## Mandatory release gates

### Claims gate — FAIL

This was the first check from the clean candidate checkout. `.factory/claims.json` does not exist. Therefore there were no listed claim commands to run through the demo entry point. The supplied contract explicitly makes a missing claims file release-blocking.

The live page and README contain reliance claims with no registry entry or claim-tagged demo test, including:

- encrypted ZIP creation on the device;
- no upload and no storage of files/passwords/file names;
- export/import and persisted acknowledgement behavior;
- offline operation after first use;
- AES-256 protection and compatible-extractor guidance;
- the one-time US $9 paid unlock.

### Cold first-read and demo gate — FAIL

On a cold 1440×900 and 390×844 load, my first read was:

- **What it does:** creates an encrypted ZIP locally and a plain-language sheet telling the recipient where the separately sent password will arrive.
- **For whom:** I inferred it is for someone sending sensitive files to a recipient. The screen does not plainly identify people sending tax, medical, legal, identity, or credential files to non-technical recipients.
- **What to click first:** `Prepare a handoff`.

The job and first real action are understandable, but the intended user is implicit. The first screen has one combined privacy line but no offline or price fact. More decisively, it has no `Try it with sample data` action.

Direct visits to `/demo` and `/?demo=1` return the ordinary real-data app. They provide no sample files, demo banner, reset action, start-for-real action, or separate storage namespace. `.factory/demo.md` is also absent. Evidence: `evidence/cold-desktop.png` and `evidence/cold-mobile.png`.

## Acceptance summary

| Area | Result | Fresh evidence |
| --- | --- | --- |
| Clean install and repository gates | PASS | `npm ci`; `npm audit --audit-level=low`; `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`; and `npm run test:browser` all passed. |
| Required claim tests | **FAIL** | `.factory/claims.json` is missing. |
| First-read and one-click demo | **FAIL** | Intended user is not plainly named; offline/price facts are absent; no sample-data action or demo sandbox exists. |
| Core encrypted handoff | PASS | Live duplicate-name/zero-byte packet decrypted with the correct password and rejected a wrong one. AES extra field `0x9901` reports strength `03`; ZIP method is 99. |
| Recipient sheet and acknowledgement | PASS | Sheet named recipient and both routes, omitted password/file names, printed nonblank, and sent/opened state survived two reloads. |
| Boundaries and recovery | PASS | Whitespace recipient and 11-character password were rejected; 80-character recipient, 12-character password, zero-byte file, duplicate names, and 5 MiB file passed after correction. Invalid secret-bearing imports were rejected. IndexedDB-blocked recovery passes the existing browser regression. |
| Paid unlock | **FAIL** | Any pasted token unlocks and exports a paid note if verification is unreachable. A `429` response disables Pro and caches `{valid:false}` for 24 hours. |
| Privacy and outbound traffic | PASS | Full free flow made 14 requests, all to the product origin. IndexedDB/export used only allow-listed checklist fields. No analytics, CDN scripts, or remote fonts loaded. |
| Desktop/mobile and axe | PARTIAL | Layout, focus treatment, light/dark contrast, touch wrappers, and reduced motion passed. Recipient and password-saved errors are not programmatically associated with their controls. |
| PWA/offline/update | PASS | Controlled offline reload, offline ZIP creation/download, offline Privacy, valid manifest, content-versioned cache, and old-to-new worker update all passed. |
| API rate limiting | PASS | Requests 1–20 returned 200. Request 21 first returned 429 with `Retry-After: 58`, `X-RateLimit-Limit: 20`, and `Cache-Control: no-store`. |
| Live deployment identity | PASS | Candidate/live hashes match for HTML, worker, manifest, JS, CSS, hero, Privacy, and Terms. |
| Performance and budgets | PASS | Lighthouse mobile: 96 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 2.1s, TBT 200ms, CLS 0. |
| Site structure and metadata | **FAIL** | No real 404, robots, sitemap, canonical, OG/Twitter metadata, apple-touch icon, consistent legal-page shell, build id, or required factory files. |

## Clean checkout and build evidence

The supplied working tree began clean on `main` at the exact candidate:

```text
git rev-parse HEAD
3bcec003d620a6ad484809c882362aa4195a8554

npm ci: PASS, 161 packages installed, 0 vulnerabilities
npm audit --audit-level=low: PASS, 0 vulnerabilities
npm test: PASS, 4 Vitest tests and 2 API tests
npm run lint: PASS
npm run typecheck: PASS
npm run test:browser: PASS, 8/8 Playwright tests
npm run build: PASS, dist/ produced
```

Production output:

```text
dist/assets/index-9QzwX4kJ.js   163,745 bytes (69.79 kB gzip)
dist/assets/index-4gaRLvHa.css   12,697 bytes (3.75 kB gzip)
dist/print-desk.webp             154,836 bytes
dist/index.html                      826 bytes
```

The JS ≤200 KB, CSS ≤50 KB, font 0/120 KB, and hero ≤300 KB budgets pass.

## End-to-end product evidence

### Working core job

The live desktop flow used two files both named `scan.pdf`, one empty and one containing a representative private record. It used an 80-character recipient name, different ZIP/password routes, and the minimum accepted 12-character password.

- The completion kit received focus.
- The archive downloaded as `confidential-handoff.zip` with entries `scan.pdf` and `scan (2).pdf`.
- Both entries were encrypted and extracted with the correct password; the wrong password failed.
- `zipinfo -v` reported encrypted method 99 and AES extra data `02 00 41 45 03 08 00`, where strength `03` is AES-256.
- The sheet named the recipient and both delivery routes, named 7-Zip/Keka/PeaZip, and contained neither the password nor the selected file names.
- The print action opened a populated recipient sheet.
- IndexedDB initially contained exactly `id`, `recipient`, `createdAt`, `delivery`, and `passwordChannel`; sent/opened timestamps were added only after acknowledgement.
- Both acknowledgement controls remained editable and persisted after reload.
- Export contained only the seven documented checklist fields.
- A secret-bearing, invalid-date import was rejected without altering the log.

Whitespace-only recipient and an 11-character password produced specific visible errors and no kit. Correcting them to `Maya` and 12 characters prepared a 5 MiB file in 1.21 seconds. This timing is evidence only, not a product claim.

The live free flow generated no console/page errors. Factory `verify-url.sh` passed in 788ms and reported a title, `lang=en`, one H1, main landmark, no missing alt, and no unnamed buttons. Evidence: `evidence/verify-url/verify.json` and `evidence/live-desktop-complete.png`.

### Paid-entitlement failures

1. **Unverified tokens unlock Pro during a network failure.** With the same-origin verification request made unreachable, pasting `not-a-real-license` left the textarea enabled and showed, `Pro remains available from its last local check`, even though no cached verdict existed. A packet then included `Paid note without a verified license` in the downloaded recipient sheet. This violates the requirement to unlock optimistically from a valid cached verdict, not from any stored string.

2. **Rate limiting is cached as license invalidity.** When the same client request received the live API's documented 429-shaped response (`valid:false`, `reason:"rate_limited"`), the app displayed `License no longer active`, disabled the note, and stored `{"checkedAt":...,"valid":false}`. That verdict is reused for 24 hours. The same failure applies to the endpoint's 503 body. A valid buyer can therefore lose paid access for a day because verification is busy or unavailable.

The checkout URL itself passed: it returned HTTP 303 to a hosted Dodo checkout session. A real purchase was not charged, so a genuinely valid production token was not available.

## Accessibility, responsive behavior, and copy

At 390×844 in both light and dark modes:

- axe-core 4.10.3 found zero violations, including zero serious/critical findings;
- document width equaled viewport width and no base horizontal overflow occurred;
- one H1, `lang=en`, `main`, labels, and decorative alt handling passed;
- visible file-picker focus used a 3px gold outline;
- actionable controls met 44px through their controls or clickable wrappers;
- keyboard flow reached the file picker, text/select fields, password generator, checkbox, submit, export/import, and purchase link;
- reduced motion produced no active animations, no transition duration, no hero transform, and automatic scroll behavior;
- 640px and 320px reflow checks had no horizontal overflow.

The remaining accessibility defect is form error association. `#recipient` lacks `aria-describedby="recipient-error"`, and `#password-saved` lacks `aria-describedby="saved-error"`. On invalid submit, focus remains on the submit button and the live region only announces the generic `There are a few details to fix` message. A screen-reader user is not given the recipient and saved-password corrections with the relevant controls.

The required `.factory/copy-audit.md` is missing. The live copy also exceeds the 22-word hard cap, including the 30-word `This cannot` sentence, a 28-word Privacy sentence about IndexedDB fields, a 30-word Privacy license sentence, and a 38-word Terms limitation sentence.

## PWA, offline, and update evidence

Chromium parsed the manifest with no errors. It has 192/512 icons, a maskable icon, standalone display, theme/background colors, and a versioned start URL.

After one controlled online load:

- the page was controlled by an activated worker;
- cache `confidential-handoff-048d1f5d2095d30d` existed;
- the root reloaded offline;
- an offline file produced and downloaded `confidential-handoff.zip`;
- `/privacy/` served its real `Privacy` page offline;
- no console/page errors occurred.

For update behavior, a local same-origin harness first served candidate ancestor `18b5f7f` with cache `confidential-handoff-v1` and `/assets/app.js`, then switched to this candidate. `registration.update()` displayed `A newer version is ready. Refresh`; Refresh changed the cache to `confidential-handoff-048d1f5d2095d30d`, loaded `/assets/index-9QzwX4kJ.js`, and exposed the candidate compatibility guidance without errors.

## Privacy, policies, and API behavior

The core flow requested only `https://confidential-file-handoff.sociobot.in`. No analytics/tracking, third-party fonts, CDN scripts, file uploads, or password requests were observed. External traffic occurs only when a user opens checkout; license checks use the same-origin gateway. The app requires no sign-in, so Microsoft Entra External ID is not applicable.

Live responses include HSTS, no-referrer, nosniff, CSP with `frame-ancestors 'none'`, Permissions-Policy, `X-Frame-Options: DENY`, COOP, and CORP. The hashed JS uses `public, max-age=31536000, immutable`; `sw.js` uses `no-cache, no-store, must-revalidate`; the manifest has `application/manifest+json`.

Rate-limit test, 30 rapid sequential live requests:

```text
requests 1–20: 200
request 21: 429
Retry-After: 58
X-RateLimit-Limit: 20
Cache-Control: no-store
overall: 25 × 200, 5 × 429 (warm workers interleaved)
```

The explicit acceptance threshold passes even though the in-memory limiter is worker-local.

## Deployment identity and performance

The live deployment matches the candidate production build:

```text
index.html                         a4094564d8476f35e0c63debfa3ec486b185b7ef5daa371fb1e1b48c18aec8e7
sw.js                              590cc4ba064582984a57951f1f1773606dbb8eab8ff8044d31535ba17fb8ce50
manifest.webmanifest               23b83e13390967d782f4872bd827c8c8ea94965b0e0e733dca151aab09b55170
assets/index-9QzwX4kJ.js           80ba1412f69667686e91fe17ab354aa503c11f817aa4404cf0b6b686b5747b86
assets/index-4gaRLvHa.css          ebfb1280c1d779d4862cf4e75bf8cdab939d0f24808a283d3f0d201d6d79e28e
print-desk.webp                    39bece74f5faba22973226434f6e566888b7635f2ea1f79ed7e87ff625ee80ca
privacy/index.html                 77b1334ffab520690f0554c4c2487920b22ecc3bd8be8ac649d1e47ec595f07c
terms/index.html                   d5ab1f9bbf80f86178de8b33ff50919bf811393198f91bc287ff2d97285aa160
```

Lighthouse 12.8.2 mobile against the live URL:

```text
Performance 96 | Accessibility 100 | Best Practices 100 | SEO 100
FCP 1.2s | LCP 2.1s | Speed Index 1.2s | TBT 200ms | CLS 0
Transferred: 224 KiB
```

Lighthouse did not provide lab INP. Full report: `evidence/lighthouse-mobile.json`.

## Site structure and documentation findings

- `/definitely-not-a-real-route` returns HTTP 200 and the home app; there is no designed 404.
- `/robots.txt` and `/sitemap.xml` return 404.
- Root metadata lacks canonical, Open Graph, Twitter card, and apple-touch icon tags. The root title is 61 characters, one over the 60-character limit.
- Privacy and Terms have distinct titles and pass axe, but do not use the consistent header/nav/footer/skip-link skeleton.
- The main footer does not link `Built by Param Factory` or show a version/build id.
- `.factory/demo.md` and `.factory/copy-audit.md` are missing in addition to `.factory/claims.json`.
- README, MIT license, brief, design thesis, privacy page, terms page, original-art provenance, and handoff documentation are present.

## Defects by severity

### Release blockers

1. `.factory/claims.json` is missing, so required claim tests cannot run and every live/README reliance claim is unlisted.
2. No one-click `Try it with sample data` experience or isolated demo sandbox exists; `/demo` and `?demo=1` silently open the real app.
3. The first screen does not plainly identify the intended sender and omits required offline and price facts.

### High

1. Any pasted token unlocks the paid note if verification is unreachable; the downloaded sheet includes the gated note without a valid or cached license verdict.
2. HTTP 429/503 verification responses are cached as `valid:false` for 24 hours, incorrectly disabling a valid paid license.

### Medium

1. Recipient and saved-password errors are not programmatically associated with their controls, while the live announcement is only generic.
2. Required routing/metadata is incomplete: no real 404, robots, sitemap, canonical, social metadata, or apple-touch tag; legal routes lack the common site shell.
3. `.factory/copy-audit.md` is absent and several live/legal sentences exceed the 22-word contract cap.

### Low

1. The root title is 61 characters instead of at most 60.
2. The footer omits `Built by Param Factory` and a build/version identifier.

## Evidence and reproduction

Committed evidence is under `.factory/evidence/`:

- cold desktop/mobile and completed-flow screenshots;
- light/dark 390px screenshots;
- factory `verify-url.sh` output and screenshots;
- Lighthouse 12.8.2 JSON.

Core commands:

```sh
git rev-parse HEAD
npm ci
npm audit --audit-level=low
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

Browser coverage used Playwright/Chromium 1.58.2 at 1440×1000, 390×844, 640px, and 320px; light/dark modes; reduced motion; online/offline contexts; axe-core 4.10.3; downloaded ZIP/sheet inspection; IndexedDB inspection; service-worker replacement; request logging; and checkout/rate-limit HTTP probes.
