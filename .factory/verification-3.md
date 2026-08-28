# Independent product verification 3 — FAIL

**Candidate:** `00eaf393928e853f4f7e16becbd9b4b40b421756`  
**URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Work order:** `confidential-file-handoff-verify-3`

## Verdict

**FAIL.** The live deployment is healthy and byte-for-byte matches the candidate. The first-read gate passes, all four registered claim tests pass, the free encrypted-handoff workflow works online and offline, and the repaired API rate limit is live. The candidate is still not releasable under the supplied contract:

1. A stored token with no cached verdict enables the paid note while license verification is pending. A delayed invalid verification allowed the note in a downloaded recipient sheet before the server rejected the token.
2. Leaving the demo through **Start for real** does not discard its IndexedDB record. Returning to `/demo` restores it despite the “nothing is saved” banner and sandbox contract.
3. Important reliance claims in the live product and README are absent from `.factory/claims.json`. The claims contract says any unlisted claim fails verification.

No product code was changed during verification.

## Acceptance summary

| Area | Result | Evidence |
| --- | --- | --- |
| Mandatory claim tests | PASS | All four exact commands from `.factory/claims.json` passed independently, one test each. |
| First-read and demo | PASS | Cold desktop and 390 px screens state the job, audience, first action, privacy/offline/price facts, and show **Try it with sample data**. |
| Clean quality gates | PASS | `npm ci`, audit, unit/API tests, lint, typecheck, 14 browser tests, and production build passed. |
| Live/candidate identity | PASS | All 16 served artifacts compared byte-for-byte equal, including HTML, assets, worker, manifest, legal pages, icons, and 404. |
| Free end-to-end job | PASS | Live representative and boundary packets decrypted; wrong passwords failed; sheet, print, acknowledgement, export, and recovery passed. |
| Demo lifecycle | **FAIL** | Demo uses only `demo:confidential-file-handoff`, but its row survives **Start for real** and re-entering `/demo`. |
| Paid unlock | **FAIL** | A stored, never-verified token enables `#custom-note` during a pending check and can produce a sheet containing the paid note. |
| Claim coverage | **FAIL** | Several live/README promises have no claim entry and tagged sandbox test. |
| Privacy | PASS | The whole demo flow made only product-origin requests plus product-origin `blob:` execution; no uploads, analytics, CDN scripts, or remote fonts. |
| API allowance | PASS | Requests 1–20 returned 200. Request 21 returned 429 with `Retry-After: 56` and `X-RateLimit-Limit: 20`. |
| Accessibility/mobile | PASS | Root, demo, Privacy, Terms, and 404 had zero axe violations in light/dark at 390 px; keyboard, focus, targets, and reduced motion passed. |
| PWA/offline/update | PASS | Offline reload created/decrypted a packet and served Privacy; ancestor worker updated to this candidate with the refresh notice and new assets. |
| Performance | PASS | Live Lighthouse Performance was 88/99/97 (median 97); Accessibility/Best Practices/SEO were 100 in all runs; LCP stayed below 2.5 s. |
| Site/copy details | PARTIAL | Real routes and root metadata pass. Non-root metadata, copy audit, footer link, caching, and build identity have defects below. |

## Mandatory gates performed first

The checkout began on `main` at exactly the candidate. Product files were clean; only interrupted verification evidence was untracked.

### Claim tests

Each command was run separately before other product testing:

```text
npm run test:browser -- --grep @claim:demo-sandbox
1 passed (9.0s)

npm run test:browser -- --grep @claim:encrypted-local-zip
1 passed (9.8s)

npm run test:browser -- --grep @claim:offline-after-first-visit
1 passed (10.1s)

npm run test:browser -- --grep @claim:local-log-export
1 passed (10.2s)
```

### Cold first-read

At 1440×900, before scrolling, the live page showed:

- Job: **Send sensitive files with clear instructions.**
- Audience: people sending tax, medical, legal, identity, or credential files to recipients who may need plain steps.
- First click: **Try it with sample data →**.
- Facts: no upload, offline after first visit, free core tools, Pro costs US $9 once.

The same information and both actions were visible at 390×844. The primary demo action occupied y=437–487 px. This gate passes.

## Clean checkout and production build

```text
git rev-parse HEAD
00eaf393928e853f4f7e16becbd9b4b40b421756

npm ci                                      PASS; 161 packages; 0 vulnerabilities
npm audit --audit-level=low                 PASS; 0 vulnerabilities
npm test                                    PASS; 4 Vitest + 2 API tests
npm run lint                                PASS
npm run typecheck                           PASS
npm run test:browser                        PASS; 14/14 Chromium tests
npm run build                               PASS; dist/ produced
```

Production output:

```text
dist/assets/main--qTiq1UH.js   165,955 B (70.45 kB gzip)
dist/assets/main-KrLWLdpv.css   13,134 B (3.81 kB gzip)
dist/print-desk.webp            154,836 B
dist/index.html                   1,840 B
dist/demo/index.html                914 B
```

The static/PWA budgets pass: JS is below 200 KB raw, CSS below 50 KB, no fonts ship, and the hero is below 300 KB.

## Deployment identity and response policy

The prior deployment-only failure is not current. Root, demo, Privacy, Terms, manifest, service worker, robots, sitemap, hashed assets, images, icons, offline page, and 404 all matched local `dist/` bytes. Representative SHA-256 values:

```text
index.html                       8c6de7b2ff0eb9a74603cc1552b3d63973514dcc450e99d2bf5844246edcb8b5
demo/index.html                  814645e015e7223fd9ee5205d2c0aba999db7a29c7719bde94224bb705bb79ee
assets/main--qTiq1UH.js         4e231b6fcdb6c9f666d07023bb884475088fd490a39df53b8fd5c51d9f482bba
assets/main-KrLWLdpv.css        1134bfe8295be8c5f77a05c133200d7c6005bbb462a699ddb176abdea8f15f41
sw.js                            2931f4397d949cab8e94e83e84b01928f8fb2ebf634ee9335173b3c6d9dbccf7
manifest.webmanifest             23b83e13390967d782f4872bd827c8c8ea94965b0e0e733dca151aab09b55170
```

The browser root response had HSTS, `no-referrer`, nosniff, CSP, Permissions-Policy, `DENY` framing, COOP, and CORP. Hashed JS/CSS use one-year immutable caching; `sw.js` uses `no-cache, no-store, must-revalidate`; the manifest has the correct MIME type. An unknown route returned HTTP 404. Checkout returned 303 to hosted Dodo.

`verify-url.sh` passed in 780 ms with no errors, `lang=en`, one H1, a main landmark, no missing image alt, and no unnamed buttons. Evidence is under `.factory/evidence/verification-3/verify-url/`.

## End-to-end evidence

### Representative and boundary flows

In a new context, `/demo` loaded two fictional files for Maya, separate email/text routes, and the sample password. Creating the packet produced:

- two encrypted entries named `2026-tax-summary.txt` and `identity-checklist.txt`;
- AES extra field `0x9901`, strength `3` (AES-256);
- successful extraction with the sample password and rejection with a wrong password;
- a sheet naming Maya and both routes, omitting password/file names, and naming compatible extractors;
- a populated printable sheet;
- sent/opened states that survived reload;
- an export containing only the seven allow-listed checklist fields.

The full flow made only product-origin requests and a product-origin `blob:` worker request. There were no console/page errors.

Additional live cases passed:

- empty submission produced four specific errors and focused the file input;
- an 80-character recipient and minimum 12-character password;
- duplicate `scan.pdf` names became `scan.pdf` and `scan (2).pdf`;
- zero-byte and 5 MiB files encrypted and extracted correctly;
- sent/opened state survived reload and IndexedDB had only allow-listed fields;
- a secret-bearing, invalid-date import was rejected without altering the valid row;
- the repository suite passed blocked-IndexedDB recovery, print, legacy-row cleanup, license stripping, temporary license errors, and offline Privacy.

### Demo lifecycle failure

After creating one demo record, QA followed **Start for real**, then opened `/demo` again. One record returned from `demo:confidential-file-handoff`. The demo does not touch the real database, but it retains demo activity after exit. That contradicts “Demo — sample data, nothing is saved” and the requirement that leaving demo discard its data or offer a keep/discard choice.

### Paid entitlement failure

A stored license token with no verdict can occur if the first check is interrupted. With `/api/license/verify` held pending, fresh load produced:

```text
license status: Checking your license…
custom note enabled: true
cached verdict: null
```

QA entered `PAID NOTE EXPOSED BEFORE VERIFICATION`, created a packet, and found that exact text in the downloaded sheet. The held request then returned `{valid:false}` and the UI disabled the field—too late for the output already created.

The cause is initialization from the mere presence of `sb_license:confidential-file-handoff`; only a cached valid verdict should enable Pro.

## Claims review

All four registered tests pass, and each ID has one tagged test. Cross-checking live copy and README found unregistered reliance claims, which is release-blocking under the supplied claims contract:

- “The password is never stored or included in the ZIP handoff sheet.” No claim test checks both storage and sheet exclusion.
- The local log stores only recipient, dates, and routes. The export claim checks downloaded JSON, not IndexedDB storage.
- AES-256 is named repeatedly. The encrypted-ZIP claim/test decrypts but does not assert AES strength 3.
- “Pro ... unlocks a custom note on recipient sheets.” No claim entry exists, and pending verification violates it.
- README promises 20 checks/minute and Privacy says license checks occur at most daily. Neither quantitative claim is registered.

Independent QA confirmed AES-256, storage allow-listing, and the 20-request limit currently work. The failure is that the release registry does not prove them on every build.

## Accessibility and responsive behavior

At 390×844 in both light and dark:

- axe-core 4.10.3 found zero violations on root, demo, Privacy, Terms, and 404;
- client width and scroll width were both 390 px;
- tested controls and wrappers were at least 44×44 px;
- the first Tab reached a visible 225×49 px skip link, whose next Tab after activation started in main content;
- the file picker had a 3 px focus outline with 3.71:1 light and 11.23:1 dark contrast;
- keyboard entry, arrows, Space, and Enter completed the form and focus moved to the kit;
- reduced motion removed animation/transform, set transitions to `0s`, and used automatic scrolling.

## PWA, offline, and update

The manifest has standalone display, versioned start URL, matching colors, and real 192/512 icons; the 512 icon is maskable.

After one live visit, `/sw.js` controlled the page and cache `confidential-handoff-5fa26a540ee2b5b8` existed. Offline `/demo` reload created and downloaded a decryptable packet, and offline `/privacy/` rendered correctly.

Update simulation first installed ancestor `3bcec00` with cache `confidential-handoff-048d1f5d2095d30d`, then served this candidate on the same origin. The app displayed **A newer version is ready. Refresh**. Refresh replaced the cache with `confidential-handoff-5fa26a540ee2b5b8` and loaded `assets/main--qTiq1UH.js` without errors.

## API, privacy, and accounts

The same live client made sequential invalid-license requests:

```text
requests 1–20: 200, X-RateLimit-Limit: 20
request 21:     429, Retry-After: 56
all responses:  Cache-Control: no-store
```

The observed allowance is **20 requests per client per 60 seconds**. Core use did not contact the API or any off-origin host. There is no sign-in, so Microsoft Entra External ID is not applicable. AI would not materially improve this local sensitive-file procedure; no missed-leverage finding was raised.

## Performance

Three live mobile Lighthouse runs from this attempt were retained:

```text
Performance: 88 / 99 / 97 (median 97)
Accessibility / Best Practices / SEO: 100 in all runs
LCP: 2.03–2.33 s | CLS: 0 | TBT: 0–396 ms | transferred: about 232 KB
```

Lab Lighthouse does not report INP. The median and LCP/CLS budgets pass; one run varied below the 90 score gate.

## Defects by severity

### Release-blocking / high

1. Paid license race permits paid output from an unverified token while verification is pending.
2. Security, storage, paid-feature, and quantitative API promises are missing from `.factory/claims.json`.

### Medium

1. Demo data is not discarded on exit.
2. `.factory/copy-audit.md` audits only the first screen, then inaccurately says all landing/legal sentences are at most 22 words. The “This cannot” landing sentence is 30 words; the README audience sentence is 25; the extractor sentence is 28.
3. Route metadata is incomplete: demo lacks OG/Twitter tags; Privacy and Terms lack descriptions, canonical/social/favicon/theme tags. The social image is 900×600 instead of 1200×630.

### Low

1. `https://paramfactory.com` failed DNS resolution; every internal link/fragment passed and checkout returned 303.
2. The live footer says `build local`, not a deploy-identifying revision.
3. Stable `/print-desk.webp` and `/icons/*` URLs receive one-year immutable caching, risking stale future updates.

## Evidence and reproduction

Evidence is in `.factory/evidence/verification-3/`: cold/completed screenshots, `verify-url/`, three Lighthouse reports, `live-qa.mjs`, and `sw-update-qa.mjs`.

```sh
node .factory/evidence/verification-3/live-qa.mjs
node .factory/evidence/verification-3/sw-update-qa.mjs
```

The update probe expects the temporary ancestor worktree path documented in its source. This is a PWA, not a library or CLI, so consumer package installation is not applicable.
