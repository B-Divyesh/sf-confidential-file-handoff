# Review round 3 handoff — Confidential File Handoff

## Outcome

Adversarial first-read review 3 is complete. The verdict is **FAIL** with four blocking findings and ten minor findings. No product code was changed.

The full report is `.factory/review-3.md`.

## Verification performed

- Opened the live root cold at 390 × 844, 1440 × 900, 1366 × 768, and 1280 × 720.
- Exercised the live demo’s sample creation, Reset, Start for real, storage isolation, and request log.
- Ran all 25 commands in `.factory/claims.json` separately: 25/25 passed.
- Confirmed all 25 claim tags occur exactly once in test source.
- Ran `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:browser`: all passed; Playwright passed 36/36.
- Audited live metadata, titles, headings, shared navigation, footer, mobile overflow, console output, and links across Root, Demo, Privacy, Terms, Offline, and 404.
- Ran live axe WCAG 2 A/AA checks on those routes: zero violations.
- Read and rechecked every finding in reviews 1–2, polish reports 1–2, and the previous handoff.
- Audited every landing and README sentence with word counts.

## Findings left for the repairer

Blocking:

1. The first action is below the fold at 1366 × 768 and 1280 × 720.
2. Privacy says the license token stays in the browser although verification sends it to `/api/license/verify`; the behavior is also unlisted in `claims.json`.
3. Privacy promises log deletion and browser-storage clearing without registered claim tests.
4. `/offline.html` lacks complete metadata and route-focus support, is absent from route test matrices, and does not share the same footer/build identifier.

Minor findings cover one deictic result heading, two unclear/jargon labels, a generic update button, a non-actionable privacy contact instruction, and five README jargon rewrites.

## How to reproduce

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

Run each `test` command in `.factory/claims.json` separately. For the first-screen failure, inspect the live root at 1366 × 768. For the route failure, open `/offline.html`, click **Privacy**, and inspect `document.activeElement`; it remains `BODY`.
