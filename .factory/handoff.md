# Repair handoff — Confidential File Handoff polish 1

## Status

All cumulative review findings are implemented, deployed, and verified from a cold live browser. Nothing is deferred.

## What changed

- Replaced the demo’s repeated landing page with a populated first-viewport workspace at `/?demo=1` and `/demo`.
- Kept demo data in its own IndexedDB database with reset and exit controls.
- Expanded the reliance inventory to 22 claims with one observable test per claim.
- Added complete metadata, a shared shell, route focus announcements, a styled 404, and a 1200×630 social image.
- Removed the dead footer link and added a full link crawl.
- Rewrote every flagged sentence and standardized **protected ZIP**, **handoff sheet**, **handoff log**, and **ZIP access phrase**.
- Preserved the dithered security-print visual identity and improved mobile text sizing.

## Local verification

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 4 Vitest and 9 gateway tests pass.
- `npm run build`: pass; `dist/index.html` exists.
- `npm run test:browser`: 32/32 pass.
- Every `.factory/claims.json` tag occurs exactly once and every listed command passes.
- `verify-url.sh` passes root and `/?demo=1` with no console errors.
- Playwright axe integration finds no violations in both mobile themes and no serious/critical legal or 404 issues.
- Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.4 s, CLS 0, TBT 0 ms.
- Initial bundles: 71.34 KB JS gzip and 4.20 KB CSS gzip.

Evidence is under `.factory/evidence/polish-1-local/` and in the two `polish-1-local-*-mobile.png` screenshots.

## Clean-clone verification

A fresh clone at candidate commit `882d179cbde82af9613e694afda159ba773a05ef` passed:

- All 22 commands in `.factory/claims.json`, run independently: 22/22.
- `npm test`: 4 Vitest and 9 gateway tests.
- `npm run lint` and `npm run typecheck`.
- `npm run build`: generated `dist/`.
- `npm run test:browser`: 32/32.

## Deployment and live verification

- Live URL: `https://confidential-file-handoff.sociobot.in`.
- Deployed repair commit: `882d179cbde82af9613e694afda159ba773a05ef`.
- Azure Static Web Apps deployment ID: `4e020d35-3576-4d58-908d-4d60177327a5`.
- `verify-url.sh` passes Root, Demo, Privacy, and Terms with exact titles, one h1, a main landmark, labels, alt text, and no console errors.
- Cold 390×844 audit: 33/33 checks pass. It covers the one-click demo, isolated namespaces, sample creation, sheet contents, reset, exit, route metadata, focus, 404, privacy, and mobile placement.
- Live offline audit: the service worker controls `/?demo=1`; reload and sample creation work with the browser offline.
- Live axe audit: zero violations on Root, Demo, Privacy, Terms, and 404.
- Live link crawl: every rendered link resolves; checkout reaches the Dodo-hosted page with status 200; no dead Param Factory link remains.
- Live Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.0 s, CLS 0, TBT 0 ms.

Live evidence is under `.factory/evidence/polish-1-live/`, including mobile screenshots and machine-readable audit JSON.

## Run

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

## Known gaps and next steps

None. Every blocking and minor finding in `.factory/review-1.md` is closed and verified on the deployed origin.
