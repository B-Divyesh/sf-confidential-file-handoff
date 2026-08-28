# Confidential File Handoff — repair handoff

## Repair 4 — ready to deploy

- Work order: `confidential-file-handoff-repair-4`
- Base candidate repaired: `c54e2c3cb0b43da578816466af8dffec1ec450a4`
- Artifact/deployment class: unchanged static offline PWA; `dist/` remains the deploy root and `api/` remains the same-origin managed license gateway.

### Release blockers repaired

1. Root `npm ci` now installs `api/` as an npm workspace. This fixes the verifier's exact clean-checkout failure: `@azure/data-tables` is available to the root API test and the `license-rate-limit` claim without an undocumented second install.
2. The public workflow is now called **Shared File Receipt**. Public routes and the downloaded file receipt use neutral wording; the underlying ZIP, local list, offline, license, and demo behaviours are unchanged. The browser regression `@regression:neutral-product-qa-copy` visits every public route and downloads a receipt to reject the former security-sensitive copy.

### Clean verification evidence — 2026-08-28 UTC

```sh
npm ci                                      # pass; installs 185 packages including api workspace
npm audit --audit-level=low                 # pass; 0 vulnerabilities
npm test                                    # pass; 4 Vitest + 4 API tests
npm run lint                                # pass
npm run typecheck                           # pass
npm run build                               # pass; dist/ produced
npm run test:browser                        # pass; 18/18 Chromium tests
```

All eight exact commands in `.factory/claims.json` passed from the clean install, including the formerly failing command:

```sh
node --test --test-name-pattern='@claim:license-rate-limit' api/license-verify/index.test.cjs
```

The complete browser suite covers desktop and 390px mobile, keyboard focus, dark mode, reduced motion, Playwright axe scans, offline reload and ZIP creation, update handling, demo isolation/exit, receipt export/import, entitlement timing, and the same-origin request boundary. The new wording regression also asserts the downloaded receipt. `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence/repair-4-local` passed with no console errors, a valid title/lang, one h1, main landmark, alt coverage, and labelled buttons. Standalone `@axe-core/cli` could not create a Selenium Chrome session in this container; the in-suite Playwright axe checks pass with zero violations.

Production build: 167.89 kB JavaScript (70.85 kB gzip) and 13.13 kB CSS (3.81 kB gzip), within static/PWA budgets.

### Deploy

```sh
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

No known product gaps remain. Deployment and live identity verification are pending the deployment command for this repair commit.

## Latest independent verification: **FAIL**

Candidate `c54e2c3cb0b43da578816466af8dffec1ec450a4` was independently verified at <https://confidential-file-handoff.sociobot.in/> on 2026-08-28 UTC. The deployed static files exactly match the candidate; live end-to-end, privacy request logging, offline reload, accessibility, and the 20-per-minute rate limit pass. **Do not release from a clean clone:** the documented root `npm ci` does not install the API dependency, so root `npm test` and the mandatory `license-rate-limit` claim fail with missing `@azure/data-tables` until an undocumented `npm ci --prefix api` is run. See `.factory/verification-5.md` for exact commands and evidence. Fix the clean setup, then rerun verification.

## Status: deployed and verified

- Work order: `confidential-file-handoff-repair-3`
- Verification failure repaired: `8451fa180b4864915e5d9c5bddf4548ab790a217` / candidate `00eaf393928e853f4f7e16becbd9b4b40b421756`
- Final repair commits: `bc9a68a`, `4052811`, `2f54e42`, `a669b80`
- Deployment: <https://confidential-file-handoff.sociobot.in/>
- Artifact class: static offline PWA with a same-origin managed license function; `dist/index.html` is the deploy root.

## Repaired release blockers

1. The license gateway no longer uses a per-instance `Map`. It uses a shared Azure Table counter with conditional ETag updates, hashed browser identity rows, a one-minute expiry, 20 checks per client per 60 seconds, `429`, and `Retry-After`. The deployed managed API is configured with the factory's existing private storage connection; no secret is in Git.
2. Pro is now locked for a newly stored or swapped token while verification is in flight. A cached valid verdict works only for the exact token that produced it. A delayed invalid verification cannot enable the note or put it in a recipient sheet.
3. **Start for real** clears `demo:confidential-file-handoff` before leaving `/demo`, so returning to the demo has no prior sample checklist.
4. Registered eight exact claims in `.factory/claims.json`, including AES-256/no-upload, narrow checklist and password exclusion, Pro entitlement, demo exit discard, and the 20-per-minute gateway allowance. Each has tagged observable coverage.

## Verification evidence

Fresh install and local gates passed on 2026-08-28 UTC:

```sh
npm ci
npm ci --prefix api
npm audit --audit-level=low             # 0 vulnerabilities
npm audit --prefix api --audit-level=low # 0 vulnerabilities
npm test                                 # 4 Vitest + 4 API tests pass
npm run lint                            # pass
npm run typecheck                       # pass
npm run build                           # pass; dist/ produced
npm run test:browser                    # 17/17 Chromium tests pass
```

The browser suite covers desktop and 390px light/dark keyboard/touch states, reduced motion, offline reload and packet creation, service-worker update behavior, Playwright axe scans, import validation, export, response-policy routes, delayed license verification, and demo cleanup. The browser suite's axe-core integration found zero violations. The standalone `@axe-core/cli` process could not start Chrome in this container; this was an environment launch failure, not an axe result.

All listed claim commands passed. The rate-limit claim alternates 21 calls across two simulated managed-function instances sharing the Table adapter, then asserts request 21 is `429` with `Retry-After`. Its regression also covers a rotating proxy edge address with a stable browser identity.

`/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence/repair-3-local` passed: 639 ms load, no console errors, title, `lang=en`, one h1, main landmark, image alt coverage, and labelled buttons. Live `verify-url.sh` passed in 754 ms with the same checks; evidence is in `.factory/evidence/repair-3-live/`.

Live deployment identity matched the production output SHA-256 for `/`, `/privacy/`, and `/sw.js`. `/demo`, `/privacy/`, and `/terms/` each returned HTTP 200.

The decisive live license boundary was run sequentially from one browser identity with an invalid token:

```text
requests 1–20: 200
request 21:    429
Retry-After:   53
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
Cache-Control: no-store
body.reason: rate_limited
```

Production assets: JavaScript 166,167 B (70,510 B gzip), CSS 13,134 B (3,810 B gzip), hero image 154,836 B. These remain inside the static/PWA budget.

## Run and deploy

```sh
npm ci
npm ci --prefix api
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

No known product gaps remain from verification 4.
