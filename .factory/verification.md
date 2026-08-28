# Independent product verification — FAIL

**Candidate:** `18b5f7f00430940296c30acb8203230c0f60f2ab`

**URL:** <https://confidential-file-handoff.sociobot.in/>

**Verified:** 2026-08-28 UTC

**Work order:** `confidential-file-handoff-verify-1`

## Verdict

**FAIL.** The live static application is deployed and byte-for-byte matches the candidate, and its free happy path creates a valid AES-encrypted ZIP locally. It is not release-ready under the supplied brief and factory contract. The persisted acknowledgement workflow cannot be completed after returning to the app, the Pro checkout is unavailable, the required license API rate limit is absent, existing PWA users cannot receive this candidate through the service worker, and axe reports a serious dark-mode contrast failure. Additional recovery, privacy, printing, and recipient-compatibility defects are listed below.

No product code was changed during verification.

## Acceptance summary

| Area | Result | Evidence |
| --- | --- | --- |
| Clean install, tests, type check, build | PASS | Clean detached worktree at the candidate; `npm ci`, 3/3 Vitest tests, `tsc --noEmit`, and Vite production build passed. No lint script exists. |
| Live deployment and candidate identity | PASS | Root returned HTTPS 200. Built/live SHA-256 values matched for `index.html`, `assets/app.js`, `assets/style.css`, and `sw.js`. |
| Core ZIP and handoff happy path | PASS | Two representative files encrypted; ZIP and sheet downloaded; sheet named the two channels and contained neither password nor file names. Correct password extracted both entries with zip.js and a wrong password returned `Invalid password`. |
| Manual acknowledgement job | **FAIL** | After reload, a pending persisted record has no sent/opened controls; only `Delete log entry` remains. A later recipient acknowledgement cannot be recorded. |
| Invalid input and recovery | **FAIL** | Basic required-field messages work, but duplicate filenames abort the ZIP, blocked IndexedDB prevents access to an already-created ZIP despite a promise that creation still works, and a semantically invalid import permanently poisons the log view. |
| Privacy/local-first | **FAIL** | Normal handoff traffic stayed local/same-origin and no analytics were found, but imported objects retain arbitrary extra `password` and `fileName` properties in IndexedDB, contradicting the stated storage boundary. ZIP central-directory file names are also readable without the password and are not disclosed in the threat model. |
| Desktop and 390px mobile | PARTIAL | End-to-end creation/download worked with no horizontal overflow at 390px, but several mobile controls are below 44px and the update toast overlays every page. |
| Keyboard and focus | **FAIL** | The full creation flow is keyboard-operable and the skip link works. The file input's visible focus is clipped to a 1x1px hidden element while the visible file-picker label has no focus treatment. |
| axe and semantics | **FAIL** | Light theme: 0 axe violations. Dark theme: 1 serious `color-contrast` violation on `#reload-app` (1.57:1). Title, `lang`, one H1, `main`, labels, and alt handling otherwise passed. |
| Reduced motion | PASS | At `prefers-reduced-motion: reduce`, scroll behavior was `auto`, button transitions were `0s`, and hero transform was `none`. |
| PWA install/offline/update | **FAIL** | Manifest had no Chromium installability errors and the cached app completed a ZIP offline. Update simulation kept serving the parent JS indefinitely; the offline privacy URL also returned the main app instead of privacy/offline content. |
| Performance/budgets | PASS | Lighthouse mobile: Performance 93, Accessibility 100 (light), Best Practices 100, SEO 100; FCP 1.3s, LCP 2.1s, CLS 0, TBT 270ms. JS/CSS/hero budgets passed. |
| Response policies and caching | **FAIL** | HSTS, referrer policy, and nosniff are present. CSP, Permissions-Policy, and clickjacking protection are absent. Assets use `max-age=30` rather than immutable versioned caching; manifest is served as `application/octet-stream`. |
| Paid unlock | **FAIL** | Verify behavior for an invalid token works and the query token is stripped, but checkout returns HTTP 404 and no exact price is stated. A valid purchase could not be exercised. |
| API rate limiting | **FAIL** | 120 simultaneous invalid-license verification GETs all returned 200; no 429 or `Retry-After` was observed. Observed threshold: greater than 120 requests per burst (or absent). |
| Documentation | PARTIAL | README, MIT license, design thesis/provenance, privacy, terms, and builder handoff exist. The source-of-truth `.factory/brief.json` is absent. |

## Clean-checkout and build evidence

Verification used a detached worktree created directly from the candidate:

```text
git rev-parse HEAD
18b5f7f00430940296c30acb8203230c0f60f2ab

Node v22.23.2
npm 10.9.8
npm ci: PASS, 57 packages installed, 0 vulnerabilities
npm test: PASS, 1 file / 3 tests
npm run build: PASS (includes tsc --noEmit)
npm audit --omit=dev: 0 vulnerabilities
```

There is no lint script or separate integration-test script in `package.json`.

Production output:

```text
dist/assets/app.js       160,250 bytes (68.49 kB gzip)
dist/assets/style.css     11,495 bytes (3.51 kB gzip)
dist/print-desk.webp     154,836 bytes
dist/index.html              806 bytes
```

The JS budget (200 KB), CSS budget (50 KB), font budget (0 of 120 KB), and mobile hero budget (300 KB) pass.

## Deployment identity and browser baseline

The previous deployment-only failure is not current: the site returned HTTPS 200 and loaded normally. Live files exactly match the candidate build:

```text
index.html       candidate/live 242e251531571b5b2439c3a9e896de7cc6aabb129a10e3963444034c1f08b133
assets/app.js    candidate/live 76aa7ea9ec99c07bc5219b3139572949337665309ce98af398a0320264fe34a4
assets/style.css candidate/live d3b1786dabec029a33f66969f8b3b4d137c0545ec9b0d296dedd5184314554a0
sw.js            candidate/live 361c73d765e1c8a05b7bb9ca796d43e3522e185b3d96a78b178c4187c27c521f
```

The factory `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200, 891ms scripted load, no console/page errors, title present, `lang="en"`, one H1, main landmark, no missing image alt, and no unnamed buttons. Normal local and live page loads produced no console/page errors. The normal live page requested only `https://confidential-file-handoff.sociobot.in`; no analytics, CDN fonts, or third-party scripts were found.

## End-to-end product evidence

### Working behavior

- Desktop 1440x1000: selected `2026-tax-return.pdf` and `résumé & credentials.txt`, chose distinct delivery/password routes, generated an 18-character password, confirmed it was saved, and prepared the packet.
- The resulting kit received focus. ZIP and text sheet downloads used the promised names.
- The sheet addressed the recipient, stated both selected channels, and contained neither the password nor selected file names.
- IndexedDB initially contained only `id`, recipient, timestamp, delivery route, and password route. Sent/opened timestamps updated when the immediate kit checkboxes were used, persisted after reload, and exported as JSON.
- Empty submission, whitespace recipient, 11-character password, and unchecked acknowledgement produced specific messages. A malformed JSON import produced a recoverable error.
- Boundary run accepted a 12-character password, enforced the 80-character recipient maximum, and created a ZIP containing a zero-byte file plus a 5 MiB file in about 1.12s.
- 390x844 mobile: packet creation and sheet download passed; client and scroll widths were both 390px; focus moved to the kit; no console errors occurred.

ZIP inspection showed two encrypted entries, AES method 99, strength 3, and the expected sizes. zip.js extracted both entries with the correct password and rejected a wrong password.

### Broken core/recovery behavior

1. **A pending acknowledgement cannot be updated after a realistic delay.** Before reload the kit exposes two checkboxes. After reload, the saved record still says `Not marked sent` / `Not acknowledged`, the kit is hidden, and the record offers only `Delete log entry`. This defeats the brief's manual acknowledgement checklist, since acknowledgement normally happens after the recipient responds later.

2. **Printing is broken.** `Print the sheet` opens a second `about:blank` page whose body is empty. `window.open(..., "noopener,noreferrer")` returns no usable popup reference, so the sheet is never written or printed.

3. **Duplicate file names abort the whole packet.** Selecting two different files both named `scan.pdf` yields `Error: File already exists`, hides the kit, and shows only the generic suggestion to try fewer files/free memory/reload.

4. **Storage-unavailable recovery is false.** With IndexedDB blocked, the log says, `You can still create and download a handoff.` The encryption step then awaits the failing log write, reports `The ZIP could not be created`, and never reveals the already-prepared ZIP/sheet.

5. **Import validation is unsafe and not recoverable.** A record with `createdAt: "not-a-date"` is accepted as valid, stored, and followed by `The valid handoff log entries were imported.` Rendering then fails; after reload the log remains inaccessible and supplies no way to delete the bad record. Separately, extra imported properties named `password` and `fileName` were stored verbatim in IndexedDB.

6. **Recipient interoperability is not adequately handled.** The generated AES ZIP works in zip.js, but the installed Info-ZIP 6.00 client rejected the correct-password archive (`need PK compat. v5.1`, exit 81). The recipient sheet only says to open the ZIP and names no compatible extractor or fallback. Windows/macOS native utilities were unavailable in this Linux container, so those compatibility paths remain unverified.

7. **ZIP file names are plaintext metadata.** `zipinfo` listed `2026-tax-return.pdf` and `résumé & credentials.txt` without a password. The UI accurately says names are not stored in the log, but the threat model never tells the sender that encrypted ZIPs expose entry names.

## Accessibility and responsive evidence

Injected axe-core 4.10.3 results:

- Main page, light theme, 390px: 0 violations.
- Main page, dark theme, 390px: 1 serious violation. `#reload-app` has teal `#72d3c8` on light `#f8f1e2`, measured at 1.57:1 versus 4.5:1 required.
- Privacy and terms, light and dark preferences: 0 violations.

The axe failure is exposed by a functional CSS defect: `#update-toast` retains `hidden=true` but computed `display:flex` and non-zero dimensions. Every fresh desktop/mobile load therefore overlays `A newer version is ready. Refresh`; pressing Refresh just reloads into the same visible toast.

Keyboard-only testing reached and operated the complete form with Tab, arrows, Enter, and Space, and focus moved to the finished kit. The skip link was first in the tab order, visibly focused, and moved navigation to `#main`. However, focus on the file input measured 1x1px and the visible `.file-picker` label had no outline, so that control has no useful visible focus indication.

At 390px, the recipient and license inputs measured about 32px high, header links about 20px high, and footer links about 15px high. These miss the 44x44 CSS-pixel target requirement. Checkbox/file inputs are wrapped by larger labels and were not counted as standalone target failures. Base mobile layout had no horizontal overflow. Reduced-motion checks passed.

## PWA/offline/update evidence

Chromium reported no manifest parse or installability errors. The active cache `confidential-handoff-v1` contained the app shell, assets, icons, manifest, and offline page. After a controlled online load and reload, `context.setOffline(true)` successfully reloaded the root and created another encrypted ZIP entirely offline.

The service-worker update contract fails empirically. A same-origin server first served the parent `0392616`, allowing its service worker and JS to cache. The server then switched to candidate `18b5f7f`, `registration.update()` was called, and the page reloaded online. The app still rendered the parent's removed `printer-ready checklist` wording, and `fetch('/assets/app.js')` still hashed to the parent:

```text
parent JS    aa34072a9c8e34f5c9b4565f84ba6787d541887835146e06fa7c944876f89036
candidate JS 76aa7ea9ec99c07bc5219b3139572949337665309ce98af398a0320264fe34a4
served after update: parent hash
```

During the candidate phase the server received only `/sw.js` and `/index.html`, never `/assets/app.js`. The candidate changed `src/main.ts` but neither `public/sw.js` nor cache version `confidential-handoff-v1`; Vite also emits the stable name `assets/app.js`. Cache-first therefore makes the old JS permanent until storage is cleared or a future worker is manually version-bumped. No waiting/installing worker or meaningful update notification appeared.

Navigating directly to `/privacy/` offline returned the main app H1 rather than the privacy page or the authored offline fallback. Since `/index.html` is always precached, `offline.html` is effectively unreachable through the navigation strategy.

## Performance evidence

Lighthouse 12.8.2 mobile against the live URL:

```text
Performance 93 | Accessibility 100 | Best Practices 100 | SEO 100
FCP 1.3s | LCP 2.1s | Speed Index 1.3s | TBT 270ms | CLS 0
Transferred total: 223 KiB
```

LCP and CLS meet the supplied budgets. Lighthouse did not provide a lab INP value; no field-data claim is made. The light-mode Lighthouse accessibility score does not supersede the explicit dark-mode axe failure.

Deployment caching does not meet the supplied caching policy. HTML, JS, CSS, and images all use `cache-control: public, must-revalidate, max-age=30`; assets are not content-hashed or immutable. Conditional `If-None-Match` does return 304. The manifest is served as `application/octet-stream` rather than a manifest/JSON content type, although Chromium still accepted it.

## Billing, rate limiting, and response policies

The exact advertised checkout target returned:

```text
GET https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The page states that Pro is one-time but gives no price. An invalid license is stored, removed from the browser URL, checked cross-origin, and correctly relocks the note field; CORS allows the product origin and the verify response uses `cache-control: no-store`. A valid checkout/license could not be tested because checkout is unavailable.

Rate-limit burst: 120 simultaneous GET requests to `/api/v1/products/confidential-file-handoff/verify?license=qa-rate-limit-invalid` produced 120 HTTP 200 responses, zero HTTP 429 responses, and no `Retry-After`. The observed limit is therefore **greater than 120 requests per burst or absent**, which fails the explicit acceptance requirement.

Static response headers include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. They omit `Content-Security-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors`, COOP, and CORP. For a tool handling selected confidential files, the lack of script/source restriction and framing protection is a material defense-in-depth gap.

The app requires no sign-in, so the Microsoft Entra External ID requirement is not applicable.

## Defects by severity

### High

1. Persisted pending records cannot be marked sent/opened after reload or tab return; the brief's acknowledgement job is incomplete.
2. Pro checkout is HTTP 404, so the advertised one-time paid feature cannot be purchased or validated end to end.
3. PWA update is broken: existing users remain on parent JS because the worker/cache version and stable asset name did not change.
4. Required API rate limiting is absent through at least 120 concurrent verification requests; no 429/`Retry-After`.
5. The always-visible update toast has an axe serious dark-mode contrast failure (1.57:1) and overlays content on every load.

### Medium

1. IndexedDB failure prevents access to the already-created ZIP and contradicts the recovery message.
2. Import validation stores arbitrary secret-like fields and accepts dates that permanently break the log UI.
3. `Print the sheet` opens a blank tab.
4. Duplicate file names abort multi-file preparation with a misleading generic error.
5. AES recipient compatibility is not explained; the available system unzip client could not open the correct-password archive.
6. Plaintext ZIP entry names are not disclosed in the threat model.
7. File-picker focus is not visibly represented; several mobile controls miss the 44px target requirement.
8. CSP, framing protection, and Permissions-Policy are absent from deployment responses.

### Low

1. Offline `/privacy/` resolves to the main app and the authored offline fallback is not reached by normal navigation failure.
2. Static caching is short-lived rather than immutable/versioned; manifest MIME type is generic binary.
3. The exact Pro price is not stated.
4. `.factory/brief.json` is missing; this verification used the researched brief embedded in the work order.

## Reproduction commands

```sh
git worktree add --detach /tmp/cfh-qa 18b5f7f00430940296c30acb8203230c0f60f2ab
cd /tmp/cfh-qa
npm ci
npm test
npm run build
npm exec vite -- preview --host 127.0.0.1 --port 4173
```

Browser coverage used Playwright Chromium 1.58.2 at 1440x1000 and 390x844, light/dark color schemes, reduced motion, online/offline contexts, and axe-core 4.10.3. Lighthouse used version 12.8.2 with its mobile preset.
