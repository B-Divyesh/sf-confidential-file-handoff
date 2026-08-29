# Polish round 3 — final finding closure

Final repaired product commit: `479e2c68a16b1eb5bef7878990daef935d515a6c`. The live static deployment is [confidential-file-handoff.sociobot.in](https://confidential-file-handoff.sociobot.in/) and identifies build `479e2c6` in every route footer.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 — demo was not in use after one click | Kept `/?demo=1` as a direct, isolated Maya sample workspace with files, routes, create action, persistent banner, Reset demo, and Start for real. | `@claim:demo-sandbox`, `@claim:demo-reset`, `@claim:demo-exit-discard`; [local mobile](evidence/polish-3-local-demo-mobile.png); [live mobile](evidence/polish-3-live-final-demo-mobile.png); live cold check passed. |
| F-1-2 — reliance claims were unlisted | Expanded the contract to 28 separately tagged, observable claims, including license-token handling, log deletion, and site-data clearing. | Final clean clone: all 28 listed commands passed independently; unique-tag audit 28/28; `.factory/claims.json`. |
| F-1-3 — route identity, metadata, focus, and shell were incomplete | Preserved product-specific titles, shared navigation/footer, route focus announcements, 404, social metadata, and final build identifiers on every static route. | `routes have exact titles, complete metadata, a shared shell, and a real 404`; live Privacy, Terms, Offline, and 404 audit. |
| F-1-4 — footer link was dead | Retained Param Factory as text, not a dead link; the usable privacy-support link now goes to Sociobot support. | `every non-download link resolves`; live `https://sociobot.in/support` returned 200. |
| F-1-5 — copy audit and terminology flags | Retained the job-first copy and consistent protected ZIP / handoff sheet / handoff log / ZIP access phrase vocabulary. | `.factory/copy-audit.md`; [local desktop first screen](evidence/polish-3-local-root-desktop.png). |
| F-2-1 — security and compatibility claims were missing | Retained separately testable filename visibility, compatibility guidance, and recipient-verification boundaries. | `@claim:zip-entry-names-visible`, `@claim:handoff-sheet-compatibility`, `@claim:no-recipient-verification`. |
| F-2-2 — AES test did not prove encryption | Retained archive assertions for WinZip AES strength 3, wrong/missing phrase failure, and successful decryption. | `@claim:encrypted-local-zip`. |
| F-2-3 — headers differed between routes | The common navigation order and mobile overflow test include Offline and 404. | `shared route headers keep the same order without mobile overflow`; final live route audit. |
| F-2-4 — README exposed jargon | Reader-facing wording keeps browser-storage details plain; technical names are explained in implementation text. | `.factory/copy-audit.md`; README language review. |
| F-3-1 — desktop first action was below the fold | Reduced desktop hero spacing and display type size without changing the print-desk identity. Headline, audience, actions, and facts fit at 1366 × 768. | `landing first screen shows the action and all three facts at 1366 by 768`; live bottoms 416, 530, 659, and 728 px. |
| F-3-2 — privacy misstated license-token handling | The browser now POSTs the token in a JSON body to `/api/license/verify`; the function accepts POST bodies only. Privacy states that boundary plainly. | `@claim:license-token-handling`; live POST returned 200 with no token in the URL. |
| F-3-3 — deletion and site-data clearing were unlisted | Added `local-log-delete` and `site-storage-clear` claims with real IndexedDB and CDP site-data assertions. | `@claim:local-log-delete`; `@claim:site-storage-clear`. |
| F-3-4 — offline route omitted from route-shell repair | Rebuilt Offline with canonical, OG/Twitter metadata, manifest, icons, live region, focusable h1, route script, shared footer, and full route-matrix coverage. | `routes have exact titles, complete metadata, a shared shell, and a real 404`; [local offline page](evidence/polish-3-local-offline.png); live Offline focus lands on `H1:Privacy`. |
| F-3-5 — result heading was deictic | Renamed it to “Send the protected ZIP and handoff sheet separately.” | Rendered copy audit; full browser suite. |
| F-3-6 — compatibility text used jargon | Rewrote it to name ZIP apps and the information to report. | Rendered copy audit; `@claim:handoff-sheet-compatibility`. |
| F-3-7 — acknowledgement heading was formal jargon | Renamed it to “Record sent and opened status.” | Rendered copy audit; delayed acknowledgement persistence test. |
| F-3-8 — update control was generic | Renamed **Refresh** to **Load the new version**. | Rendered copy audit; browser route suite. |
| F-3-9 — privacy contact had no path | Linked **Contact Sociobot support** to `https://sociobot.in/support`. | Link crawl test; live support URL returned 200. |
| F-3-10 — README said JSON without outcome | Rewrote the reader copy as a restorable handoff-log backup, with JSON only as a parenthetical file-format detail. | README and `.factory/copy-audit.md`. |
| F-3-11 — README exposed IndexedDB jargon | Rewrote it as separate browser databases before naming the two implementation database names. | README and `.factory/copy-audit.md`. |
| F-3-12 — README used cache protocol jargon | Rewrote it as browsers and proxies not caching the license response. | README and `.factory/copy-audit.md`. |
| F-3-13 — README deploy wording assumed infrastructure knowledge | Rewrote it as files to deploy with the same-site API directory. | README and `.factory/copy-audit.md`. |
| F-3-14 — README design wording was abstract | Rewrote it to describe the print style and where the artwork came from. | README and `.factory/copy-audit.md`. |

## Final evidence

- Fresh GitHub clone at `479e2c6`: `npm ci`; all 28 `.factory/claims.json` commands independently passed; every tag occurs exactly once.
- Final clean clone: `npm test` (4 Vitest + 10 gateway tests), `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:browser` (39/39) passed.
- Live root verification: [verify report](evidence/polish-3-live-final-root/verify.json), [desktop screenshot](evidence/polish-3-live-final-root/screenshot-desktop.png), and [mobile screenshot](evidence/polish-3-live-final-root/screenshot-mobile.png).
- Final live screenshots: [demo mobile](evidence/polish-3-live-final-demo-mobile.png) and [privacy mobile](evidence/polish-3-live-final-privacy-mobile.png).
- Live axe WCAG 2 A/AA scan: zero serious or critical violations on Privacy, Terms, Offline, and 404. Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 2.117 s, CLS 0, TBT 84 ms ([JSON](evidence/polish-3-live-lighthouse.json)).
