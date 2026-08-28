# Independent product verification 6 — FAIL

**Candidate:** `136dcd57ea620630bf62cfd4e14dd7d8f09cfaf6`  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Work order:** `confidential-file-handoff-verify-6`

## Verdict

**FAIL — do not release.** The deployed static product is exactly this candidate and the local build, declared claims, basic offline workflow, and most accessibility checks pass. Three independent release-blocking findings remain: the production license endpoint returns HTTP 500 and never enforces its stated request allowance; the generated recipient sheet instructs recipients to find a filename that is not downloaded and contains broken wording; and the cold first screen does not plainly say that the product creates a protected ZIP and recipient instructions.

## Mandatory first gates

`.factory/claims.json` is present and has eight entries. From the clean checkout after the documented `npm ci`, every exact listed command passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:browser -- --grep @claim:demo-sandbox` | PASS (1) |
| `encrypted-local-zip` | `npm run test:browser -- --grep @claim:encrypted-local-zip` | PASS (1) |
| `offline-after-first-visit` | `npm run test:browser -- --grep @claim:offline-after-first-visit` | PASS (1) |
| `local-log-export` | `npm run test:browser -- --grep @claim:local-log-export` | PASS (1) |
| `checklist-secrets-excluded` | `npm run test:browser -- --grep @claim:checklist-secrets-excluded` | PASS (1) |
| `pro-note-entitlement` | `npm run test:browser -- --grep @claim:pro-note-entitlement` | PASS (1) |
| `demo-exit-discard` | `npm run test:browser -- --grep @claim:demo-exit-discard` | PASS (1) |
| `license-rate-limit` | `node --test --test-name-pattern='@claim:license-rate-limit' api/license-verify/index.test.cjs` | PASS (1) |

Cold live first-read at 1440px showed **“Create a shared file receipt.”**, then **“For people sending files to someone who may need simple steps for opening them.”**, with a visible **“Try it with sample data”** action. The action is one click and `/demo` is a genuine isolated sample sandbox. This does answer whom and what to click first, but **fails the supplied plain-words acceptance test for what it does**: “shared file receipt” is not a plain description of an encrypted/protected ZIP plus handoff instructions, which is the actual job in the researched brief. The first screen never says that it protects a ZIP or produces recipient instructions.

## Clean local checks

```text
npm ci                 PASS; 185 packages, 0 audit vulnerabilities
npm test               PASS; 4 Vitest + 4 API tests
npm run test:browser   PASS; 18/18 Chromium tests
npm run typecheck      PASS
npm run lint           PASS
npm run build          PASS; dist/ produced
```

The build is 167,893 B JavaScript (70.85 kB gzip), 13,134 B CSS (3.81 kB gzip), and a 154,836 B hero image: within the supplied static/PWA budgets. Lighthouse CLI and standalone `@axe-core/cli` could not attach to the preinstalled Playwright Chromium in this container; Playwright axe-core scans were used instead.

## Live deployment identity, privacy, PWA, and accessibility

- The built root HTML, hashed JS, CSS, service worker, privacy page, terms page, and manifest each SHA-256 byte-match live production. The live deployment is this candidate, not a stale revision.
- Full live `/demo` request logging during sample preparation and both downloads observed only `https://confidential-file-handoff.sociobot.in`; no uploads, third-party scripts, analytics, fonts, or off-origin calls occurred. Page and console errors were empty for that flow.
- The sample ZIP contained `project-update.txt` and `meeting-notes.txt`; extraction with `sample-password-2026` returned its original content and a wrong phrase was rejected. The normal-file path also handled empty submission with actionable errors/focus and created a ZIP at the 12-character boundary.
- After service-worker control, a live offline `/demo` reload still created the packet with no errors. The versioned worker precaches the shell and uses `skipWaiting` plus `clients.claim`; the app includes the update-notice path. Hashed assets are `Cache-Control: public, max-age=31536000, immutable`; `sw.js` is no-store.
- `/opt/fleet/lib/verify-url.sh` passed against local production build and live: HTTP 200, title, `lang=en`, one h1, main landmark, alt coverage, labelled buttons, and no load console errors. Live root headers include HSTS, CSP with response-header `frame-ancestors 'none'`, no-referrer, nosniff, Permissions-Policy, DENY framing, COOP, and CORP.
- Playwright axe-core reported zero serious/critical violations on desktop and 390px dark/reduced-motion views. At 390px, `scrollWidth` equalled `clientWidth` (390px); keyboard Tab showed the skip link and subsequent controls with a visible 3px gold focus ring. Reduced-motion view had zero elements with active transitions/animations.

## Production license check and observed allowance

This must be assessed from the deployment, not the passing in-memory unit claim. Twenty-one sequential **GET** requests from one stable client identity to:

```text
https://confidential-file-handoff.sociobot.in/api/license/verify?license=qa-verification-6-invalid-token
```

returned **HTTP 500 with an empty response body for requests 1 through 21**. No response supplied `Retry-After`, `X-RateLimit-Limit`, or `X-RateLimit-Remaining`; a HEAD request returned 404. A browser visit with `?license=qa-ui-invalid-token` likewise received HTTP 500, showed the graceful locked message, and logged a browser console resource error.

**Observed allowance: none.** The documented allowance is 20 checks per client per 60 seconds, but production did not serve any successful check or the mandatory 429/`Retry-After` once exceeded. This is a deployment-only failure despite the local claim test passing.

## Defects by severity

### High — release blocking

1. **Live license gateway is broken and no live rate limit is enforced.** Every GET to `/api/license/verify` returned 500, including the 21st request. This prevents a purchased Pro license from being verified, violates the documented 20-per-60-second allowance, and produces a console error on the user-triggered restore path. Repair the deployed managed-function configuration/dependency/storage path, then prove 20 allowed checks followed by HTTP 429 with a `Retry-After` header from one live client.

2. **Recipient sheet names the wrong download and has broken, non-plain wording.** The live download is `shared-file-receipt.zip`, while its sheet tells the recipient to receive `shared-handoff.zip`. The same sheet says “an prepared ZIP folder,” “a access phrase,” and “an ZIP extractor.” This directly harms the brief’s non-technical-recipient success measure and is caused by blanket copy substitutions. Generate the final recipient text directly, keep the actual filename, and test the downloaded sheet’s exact instructions.

3. **First screen fails the mandatory plain-words contract.** “Create a shared file receipt” does not explain the actual core job to a cold visitor: make a protected ZIP locally and give the recipient clear two-channel opening instructions. The work order explicitly makes this a candidate failure even though the one-click demo is present. Restore a direct, truthful job headline and supporting sentence without hiding the encryption/threat-model facts.

### Medium

4. **The footer’s `https://paramfactory.com` link did not resolve in the verification environment** (`curl: (6) Could not resolve host`). All product routes and the Sociobot/Dodo checkout link returned 200. Verify or replace this external link before release because the site-structure contract prohibits dead links.

## Required release condition

Fix the production API deployment, recipient-sheet generator, and first-screen copy; then repeat all eight exact claims, a clean install/build, and the live 21-request allowance test. Do not accept based only on the local API unit test.
