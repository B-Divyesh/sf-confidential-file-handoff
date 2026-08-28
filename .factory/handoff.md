# Polish round 2 handoff — Confidential File Handoff

## Status

Complete. Every finding in `.factory/review-1.md` and `.factory/review-2.md` is fixed, tested, pushed, deployed, and rechecked cold on the live URL. No known product gap or deferred minor item remains.

## What changed

- Added explicit, observable claims for ZIP filename exposure, extractor/fallback guidance, and the absence of recipient verification.
- Made the AES-256 claim test prove WinZip AES strength 3, reject missing and wrong phrases, and decrypt with the correct phrase.
- Standardized the ordered header navigation on Root, Demo, Privacy, Terms, 404, and offline pages.
- Fixed focus restoration for cross-page hash links as well as normal navigation and Back/Forward.
- Removed untestable public limitation promises and moved README implementation jargon into developer sections.
- Updated `.factory/claims.json`, `.factory/copy-audit.md`, `.factory/catalog-description.txt`, and `.factory/polish-2.md`.
- Preserved the dithered security-print identity and original product artwork.

## Verification

A fresh local clone of commit `82e1e2a842082108a8df6c5d29dfe2a469b026e2` passed:

- Every command in `.factory/claims.json`, run separately: 25/25.
- Claim-tag audit: every one of 25 IDs occurs exactly once in test source.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 4 Vitest tests and 9 gateway tests pass.
- `npm run build`: pass; `dist/index.html` and `dist/demo/index.html` exist.
- `npm run test:browser`: 36/36 pass.
- Initial bundles: 71.30 KB JS gzip and 4.20 KB CSS gzip.
- Local `verify-url.sh`: Root, Demo, Privacy, and Terms return 200 with exact titles, `lang=en`, one h1, a main landmark, labelled buttons/images, and no console errors.
- Local Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.3 s, CLS 0, TBT 120 ms.

The browser suite covers successful and failed ZIP decryption, duplicate filenames, delayed acknowledgements, blocked storage, strict import validation, license boundaries, demo isolation/reset/exit, privacy request logs, offline creation, metadata, focus, 404, links, mobile touch targets, both color schemes, and axe accessibility checks.

## Deployment and live verification

- Repair commit pushed to `origin/main`: `82e1e2a842082108a8df6c5d29dfe2a469b026e2`.
- Azure Static Web Apps deployment ID: `4b4b963f-6103-4c97-a762-1ed72159e132`.
- Live URL: `https://confidential-file-handoff.sociobot.in`.
- Production footer build: `82e1e2a`.
- Cold live demo/archive audit: 18/18 checks pass, including first-viewport sample/action, isolated database, Reset, same-origin requests, AES-256 metadata, missing/wrong phrase rejection, successful decryption, visible entry names, and exact compatibility guidance.
- Cold live route audit: 24/24 checks pass across Root, Demo, Privacy, Terms, and 404, including the identical header, 390px overflow, semantic skeleton, route focus/announcement, and zero serious/critical axe findings.
- Live offline audit: service worker controls the demo; cold offline reload and sample handoff creation pass.
- Live unknown route returns HTTP 404 with the designed page.
- Final `verify-url.sh` checks report no console or page errors.
- Final live Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.1 s, CLS 0, TBT 130 ms.

Evidence is in `.factory/evidence/polish-2-local/` and `.factory/evidence/polish-2-live/`. The live prepared demo is `.factory/evidence/polish-2-live/demo-created-mobile.png`.

## Run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Run every `test` command in `.factory/claims.json` separately to reproduce the claim audit.

## Known gaps and next steps

None.
