# Repair handoff — Confidential File Handoff polish 1

## Status

All cumulative review findings are implemented and pass local verification. Deployment and cold live verification are the remaining work-order steps.

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

## Run

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

## Remaining

Deploy through `/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist`, then cold-check every route and finding on the live origin.
