# Independent product verification 5 — FAIL

**Candidate:** `c54e2c3cb0b43da578816466af8dffec1ec450a4`  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Work order:** `confidential-file-handoff-verify-5`

## Verdict

**FAIL — do not release from a clean checkout.** The deployed product matches this candidate exactly and the product workflow, privacy boundary, accessibility, offline operation, and live rate-limit boundary all passed. One release-blocking clean-install defect remains: the documented root setup (`npm ci`) does not install the API package dependency needed by both `npm test` and the declared `license-rate-limit` claim. Consequently the stated clean-checkout commands fail unless the verifier discovers and runs an undocumented `npm ci --prefix api`.

## Mandatory first gates

`.factory/claims.json` exists and declares eight claims. The first attempted commands from the clean clone failed before test execution because no packages were installed, as expected. After the documented root `npm ci`, the seven browser claims passed individually against the `/demo` entry point. The eighth exact declared command failed:

```text
node --test --test-name-pattern='@claim:license-rate-limit' api/license-verify/index.test.cjs
Error: Cannot find module '@azure/data-tables'
```

That is a release-blocking claim-test failure under the documented clean setup. After the additional, undocumented `npm ci --prefix api`, that exact test passed, including 20 allowed checks and a 21st `429` with `Retry-After`. The other passing claims were `demo-sandbox`, `encrypted-local-zip`, `offline-after-first-visit`, `local-log-export`, `checklist-secrets-excluded`, `pro-note-entitlement`, and `demo-exit-discard`.

Cold first-read **passes**. A fresh 1440px live visit says “Send sensitive files with clear instructions,” names people sending tax, medical, legal, identity, or credential files, and presents the visible first action **Try it with sample data**. The 390px view retains that action.

## Local checks

With `npm ci` followed by `npm ci --prefix api`:

```text
npm test             PASS — 4 Vitest tests and 4 API tests
npm run lint         PASS
npm run typecheck    PASS
npm run build        PASS — dist/ produced
npm run test:browser invoked; all 17 tests ran to completion without a reported failure
npm audit            PASS — 0 vulnerabilities
npm audit --prefix api PASS — 0 vulnerabilities
```

The production build is 166,167 B JavaScript (70.51 kB gzip), 13,134 B CSS (3.81 kB gzip), and a 154,836 B hero image, within the supplied static/PWA budgets. Lighthouse CLI could not attach to the preinstalled Playwright Chromium in this container; this is not used to excuse the clean-install failure.

## Live functional, privacy, PWA, and accessibility evidence

- Fresh `/demo` flow: sample files for Maya were present; it created a ZIP containing `2026-tax-summary.txt` and `identity-checklist.txt`; extraction with `sample-password-2026` succeeded and a wrong password failed. The downloaded sheet contained no password. Sent/opened acknowledgement state persisted. An invalid JSON import returned the actionable no-import error and did not poison the log.
- The full request log over that flow contained only `https://confidential-file-handoff.sociobot.in` resources. There were no uploads, third-party scripts, fonts, analytics, or page/console errors.
- After service-worker control, cache `confidential-handoff-dd18a34a7c8adee9` was present. A live `/demo` reload while offline retained the sample, created the packet, and `/privacy/` loaded offline. The worker is versioned, precaches the shell, calls `skipWaiting` and `clients.claim`, and the app contains the update notification path.
- Empty submission announced “Fix the marked fields before preparing the packet” and focused the first invalid field. Keyboard tab starts at the visible skip link; visible focus is solid. At 390px dark/reduced-motion, checked interactive targets were at least 44px and reduced motion computed `scroll-behavior: auto`.
- Axe-core found **zero serious or critical** issues on the live root. `/opt/fleet/lib/verify-url.sh` passed: 200, no errors, correct title/lang, one h1, main landmark, no missing image alt text, and no unlabeled buttons. Evidence: `.factory/evidence/verification-5/verify-url/verify.json`.
- Production headers have HSTS, no-referrer policy, nosniff, CSP, Permissions-Policy, DENY framing, COOP and CORP. Hashed assets are `max-age=31536000, immutable`; `sw.js` is no-store. `/demo`, `/privacy/`, `/terms/`, and the designed 404 route returned their expected status/pages.

## Deployment identity and server allowance

Every checked production artifact byte-matches the build from this commit: root, demo, privacy, terms, 404, offline page, manifest, service worker, robots, sitemap, JavaScript, CSS, hero art, and all icons (16 artifacts total). The live product is therefore this candidate, not a stale deployment.

The documented server-side allowance is now enforced in production. Using one stable client identity, the shared current window showed remaining capacity declining to zero and the next requests returned:

```text
request 20: 429, X-RateLimit-Remaining: 0, Retry-After: 43
request 21: 429, X-RateLimit-Remaining: 0, Retry-After: 41
```

The first request began at remaining 18 because an earlier missing-token API check had already used that identity/window. This still proves rejection once the single client exceeded the documented 20 checks per 60 seconds. The initial API response also advertised `X-RateLimit-Limit: 20` and `Cache-Control: no-store`.

## Defects by severity

### High — release blocking

1. **Clean checkout is not self-contained.** README says to run `npm ci`, then `npm test` and every claim command. Root installation omits `api/node_modules`, so `@azure/data-tables` is absent and root `npm test` plus the required `license-rate-limit` claim fail. Add a root workspace/install script or explicitly require `npm ci --prefix api` before every documented test command; then reverify from a fresh clone.

### Medium / low

None found in the exercised live product.

## Required release condition

Make the documented clean setup install every package required by the root test and claims commands, then rerun all eight exact claim entries and `npm test` from a fresh checkout without relying on verifier-discovered setup steps.
