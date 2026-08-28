# Polish round 2 — cumulative finding closure

Candidate `df325ca09efb17fc0294c75745452c82e1fe11ba` was repaired against every finding in `review-1.md` and `review-2.md`. Repair commit: `82e1e2a842082108a8df6c5d29dfe2a469b026e2`.

## Finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 — demo was not in use after one click | Kept the direct `/?demo=1` workspace with two files, Maya, both routes, and **Create sample handoff** in the first 390×844 viewport. Demo records remain in `demo:confidential-file-handoff`; Reset and Start for real clear only demo activity. | `@claim:demo-sandbox`, `@claim:demo-reset`, `@claim:demo-exit-discard`; [local mobile screenshot](evidence/polish-2-local/demo/screenshot-mobile.png); [live prepared demo](evidence/polish-2-live/demo-created-mobile.png); live `/?demo=1` cold check. |
| F-1-2 — reliance claims were unlisted | Expanded `.factory/claims.json` to 25 claims. Each ID occurs in exactly one tagged test, and all 25 listed commands pass independently from a clean clone. Added the security and compatibility claims missed in round 1. Removed public device-security, forwarding, malware, compliance, and refund statements that could not be observed honestly. | Claim-tag uniqueness audit: 25/25; clean-clone claim run: 25/25; `@claim:zip-entry-names-visible`, `@claim:handoff-sheet-compatibility`, `@claim:no-recipient-verification`; live archive/sheet audit: 18/18. |
| F-1-3 — route identity, metadata, focus, and 404 were incomplete | Retained exact route titles, descriptions, canonicals, social metadata, favicon, one h1, shared shell, focus announcement, and HTTP 404. Fixed cross-page hash links so they focus and announce the destination h1. Standardized the route headers. | `routes have exact titles, complete metadata, a shared shell, and a real 404`; `internal navigation and browser Back move focus to and announce the route heading`; live route audit: 24/24; live verify JSON under `evidence/polish-2-live/`; unknown live route returns 404. |
| F-1-4 — dead Param Factory footer link | Kept **Built by Param Factory** as non-linked attribution. The crawler covers every remaining rendered link. | `every non-download link resolves`; live route crawl during the cold audit; no `paramfactory.com` URL in the product. |
| F-1-5 — copy flags and inconsistent terms | Retained the job-first headline and concrete section names. Standardized **protected ZIP**, **handoff sheet**, **handoff log**, and **ZIP access phrase**. Rewrote the remaining README jargon and updated `.factory/copy-audit.md`. | `.factory/copy-audit.md`; first screen in [live mobile screenshot](evidence/polish-2-live/root/screenshot-mobile.png); no reader-facing sentence over 22 words. |
| F-2-1 — security and compatibility promises still lacked claims | Added separate filename-visibility and handoff-sheet compatibility claims. The archive test lists names without a phrase. The sheet test requires 7-Zip, Keka, PeaZip, their platforms, and the device/app fallback. Added an observable recipient-verification boundary and removed untestable absolute limitation copy. | `@claim:zip-entry-names-visible`; `@claim:handoff-sheet-compatibility`; `@claim:no-recipient-verification`; clean-clone 25/25 claim run; live archive/sheet audit: 18/18. |
| F-2-2 — AES test could pass an unencrypted ZIP | Strengthened the registered AES claim test to require `encrypted: true`, non-ZipCrypto AES metadata, `extraFieldAES.strength === 3` (256-bit), failure with no phrase, failure with a wrong phrase, and successful extraction with the sample phrase. | `@claim:encrypted-local-zip`; clean-clone individual claim pass; live downloaded-archive check passed AES strength 3, both failure paths, and correct decryption. |
| F-2-3 — headers differed between routes | Root, Demo, Privacy, Terms, 404, and offline now use the same ordered navigation: Demo, How it works, Handoff log, Privacy. Cross-route hash navigation participates in focus restoration. | `shared route headers keep the same order without mobile overflow`; route metadata test; live 390px audit across five routes: no horizontal overflow. |
| F-2-4 — README exposed storage/platform jargon | Reader sections now say **browser database**, **this product**, **browser result**, and **irreversible browser identifier**. Exact IndexedDB names, API path, same-origin behavior, and deployment terms moved to developer-only sections. | README language check in `.factory/copy-audit.md`; `npm run lint`; manual sentence audit. |

## Verification and release evidence

- Clean clone at `82e1e2a`: all 25 claim commands pass independently; `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:browser` pass.
- Test totals: 4 Vitest tests, 9 gateway tests, and 36 Playwright tests.
- Browser coverage includes axe, 390px light/dark layouts, touch targets, focus, route announcements, privacy request logging, link crawling, real 404 behavior, and offline service-worker reload.
- Build output: `dist/index.html`; initial JS 71.30 KB gzip; CSS 4.20 KB gzip.
- Local Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.3 s, CLS 0, TBT 120 ms.
- Final live Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.1 s, CLS 0, TBT 130 ms.
- Final deployment: Azure Static Web Apps ID `4b4b963f-6103-4c97-a762-1ed72159e132`; live URL `https://confidential-file-handoff.sociobot.in`; footer identifies build `82e1e2a`.

Every finding from both review rounds is closed. No minor item is deferred.
