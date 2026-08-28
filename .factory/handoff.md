# Confidential File Handoff — repair handoff

## Status: repaired, deployed, and verified

- Work order: `confidential-file-handoff-repair-5`
- Base verifier report: `8e6b45cd9b9ef1e0f61d983937cf578d7d138d04` for candidate `136dcd57ea620630bf62cfd4e14dd7d8f09cfaf6`
- Repair commits: `23f5e51`, `b236591`, `de1ef0c`, `e174e72`, `bdea05d`
- Artifact/deployment class: unchanged static offline PWA. `dist/` remains the deploy root and `api/` remains the same-origin managed license gateway.
- Live: <https://confidential-file-handoff.sociobot.in/>

## Release blockers repaired

1. Reproduced the reported production failure first: a GET to `/api/license/verify` returned empty HTTP 500. The managed host could not load the optional Table SDK, then its function-style logger turned the handled failure into another 500.
2. The gateway now loads the Table adapter inside the request handler, uses a safe logger, and retains the documented counter when that optional adapter is unavailable. It returns structured responses instead of an empty 500.
3. Live proof, one stable browser identity and invalid token on 2026-08-28 UTC: requests 1–20 returned HTTP 200 with `X-RateLimit-Remaining` from `19` to `0`; request 21 returned HTTP 429 with `Retry-After: 41`, `X-RateLimit-Limit: 20`, `X-RateLimit-Remaining: 0`, `Cache-Control: no-store`, and `reason: rate_limited`.
4. Pinned and explicitly installed the API runtime dependencies for clean installs and managed-function packaging. Regression coverage includes the SDK-startup fallback, a function-style logger, Node-compatible dependency lock entries, and the exact 20-then-429 boundary.
5. Removed the blanket public-copy substitutions. The first screen now plainly says “Create a protected ZIP with opening instructions.”
6. The recipient-sheet generator now directly creates grammatical instructions, names the actual `shared-file-receipt.zip` download in every opening step, and tells the recipient that the ZIP access phrase arrives separately. The download/sheet regression checks both artifacts and rejects the former broken phrases.

## Verification

Fresh clean install and local checks passed on 2026-08-28 UTC:

```sh
npm ci                                  # pass; 188 packages, 0 vulnerabilities
npm audit --audit-level=low             # pass; 0 vulnerabilities
npm test                                # pass; 4 Vitest + 7 API tests
npm run lint                            # pass
npm run typecheck                       # pass
npm run build                           # pass; dist/ produced
npm run test:browser                    # pass; 18/18 Chromium tests
```

All eight exact commands declared in `.factory/claims.json` pass. Static products have no consumer package to install separately.

Browser coverage includes desktop and 390px mobile, keyboard/focus targets, light/dark modes, reduced motion, Playwright axe scans with zero violations, offline reload and packet creation, update flow, demo isolation/exit, local-only request assertions, export/import, and entitlement timing.

`/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence/repair-5-local` passed: 628 ms load, no console errors, valid title/lang, one h1, main landmark, image alt coverage, and labelled buttons. Standalone `@axe-core/cli` could not create a Selenium Chrome session in this container; the shipped Playwright axe scans passed instead.

Live browser smoke check passed: desktop `/demo` created and downloaded recipient instructions containing `shared-file-receipt.zip` and the separate-access-phrase guidance with no console errors. At 390px, `scrollWidth === clientWidth === 390`. Live response headers include CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

Production output: JavaScript 166,226 B (70.46 kB gzip), CSS 13,134 B (3.81 kB gzip), and hero image 154,836 B. All are within the static/PWA budgets.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

No known release-blocking gaps remain.
