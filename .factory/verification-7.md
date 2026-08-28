# Independent product verification 7 — PASS

**Candidate:** `b5a8f6d584bd20b7f1319a847024b758ad573356`  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Work order:** `confidential-file-handoff-verify-7`

## Verdict

**PASS — release candidate accepted.** The live deployment byte-matches a fresh production build of the stated candidate. The previous deployment-only license-gateway failure is repaired: the live endpoint enforces the documented allowance. The required claims, core local encrypted-ZIP workflow, demo isolation, privacy behavior, offline PWA behavior, accessibility, and production checks passed.

## First gates

`.factory/claims.json` is present and declares eight tests. From this clean checkout after `npm ci`, every exact command passed:

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

Cold live first read at 1440px: **“Create a protected ZIP with opening instructions.”** It says this is for people sending personal files to recipients who need separate opening steps, and presents the one-click **“Try it with sample data”** action. `/demo` immediately loads two fictional sample files, with the persistent separate-storage banner, Reset demo, and Start for real controls. This satisfies the plain-words and demo gates.

## Clean local checks

```text
npm ci                 PASS; 188 packages, 0 audit vulnerabilities
npm test               PASS; 4 Vitest tests + 7 API tests
npm run lint           PASS
npm run typecheck      PASS
npm run build          PASS; dist/ produced
npm run test:browser   PASS; 18/18 Chromium tests
```

The production build contains 166,226 B JavaScript (70.46 kB gzip), 13,134 B CSS (3.81 kB gzip), and a 154,836 B hero image: within the supplied PWA budgets. Mobile Lighthouse against live production scored **98 performance** and **100 accessibility** (FCP 1.5 s, LCP 2.3 s, CLS 0, TBT 80 ms).

## Independent live evidence

- `dist/index.html`, `main-Rnsj1oR8.js`, `main-KrLWLdpv.css`, and `sw.js` SHA-256 byte-match the live responses. The deployed page is this candidate, not a stale revision.
- In a fresh live `/demo` browser context, the normal workflow produced `shared-file-receipt.zip` with `project-update.txt` and `meeting-notes.txt`. The sample phrase decrypted content; a wrong phrase was rejected. The recipient sheet named the downloaded ZIP and its separate Text-message password route, and did not contain the phrase. The exported log contained only `createdAt`, `delivery`, `id`, `passwordChannel`, and `recipient`.
- Sent/opened acknowledgements survived reload. Leaving demo discarded its demo receipt list. An empty live submission announced actionable errors and focused the file picker.
- Whole-flow Playwright request logging from demo load through ZIP/sheet/export downloads observed no off-origin request. It also observed no page or console error. This corroborates the local-only file promise for the core flow.
- After the service worker controlled the live page, setting the browser offline, reloading `/demo`, and preparing the packet all succeeded. The live worker is content-versioned (`confidential-handoff-08b6774086dc46d2`), precaches the shell, and implements `skipWaiting`, `clients.claim`, old-cache cleanup, and the in-app update notice path.
- Desktop and 390px mobile passed: no horizontal overflow at 390px, visible keyboard focus/skip link, 18-character generated phrase by keyboard, and reduced motion changed smooth scrolling to `auto`. Live axe-core scans had zero serious or critical findings on desktop light and mobile dark/reduced-motion views.
- Live root headers include response-header CSP with `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, frame denial, COOP/CORP, and Permissions-Policy. Hashed assets are `Cache-Control: public, max-age=31536000, immutable`; `sw.js` is no-store. Root, demo, privacy, terms, manifest, robots, sitemap, and 404 page returned 200 at their expected URLs.

## Live license allowance

Using one new stable browser client identity, 21 sequential live requests to:

```text
GET /api/license/verify?license=qa-independent-rate-limit-a7f3c
```

returned HTTP 200 with `X-RateLimit-Limit: 20` and `X-RateLimit-Remaining` counting 19 through 0 for requests 1–20. Request 21 returned **HTTP 429**, `X-RateLimit-Remaining: 0`, and **`Retry-After: 58`**, with `reason: rate_limited`. Observed allowance: **20 checks per client per 60 seconds**. This directly resolves the deployment-only 500 finding in verification 6.

## Defects by severity

### Release-blocking

None.

### Low — follow-up metadata polish

1. `/demo` changes its browser title to `Demo — Protected ZIP instructions`, while its static HTML title and the Privacy/Terms static titles retain the older product name **“Shared File Receipt.”** Use the canonical product name consistently, e.g. `Demo — Confidential File Handoff`, `Privacy — Confidential File Handoff`, and `Terms — Confidential File Handoff`.
2. The Open Graph image is the otherwise appropriate original 900×600 hero illustration. The factory site-structure standard calls for a 1200×630 social preview asset; add a cropped/composed original preview at that size and point OG/Twitter metadata to it.

These are metadata/identity improvements only; they do not invalidate the tested encrypted local handoff, privacy, accessibility, or deployment behavior.
