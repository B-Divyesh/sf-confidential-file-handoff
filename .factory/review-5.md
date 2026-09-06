# Create and hand off protected files — review 5

**Reviewed:** 2026-09-06 UTC  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Implementation reviewed:** `479e2c68a16b1eb5bef7878990daef935d515a6c` (`fix: complete 404 PWA metadata`)  
**Live documentation/build SHA:** `02c47c6c4da90497af93ded6aa998cfbf05359e5`  
**Report SHA before this review:** `a9dd814f7f5dc85308d9a1c7547475317009f881`

## Verdict: FAIL

There is one high-severity finding. All declared claim commands passed, so there are **zero untested claims**. A PASS is not possible while the populated handoff result has a misleading primary download control.

## Job, audience, and first action

Fresh Chromium contexts were opened at 1366 × 768 and 390 × 844 before scrolling.

- **Job:** Create a protected ZIP and give the recipient opening instructions.
- **Audience:** People sending personal files to recipients who need clear, separate opening steps.
- **First action:** **Try it with sample data**, which opens Maya's filled sample handoff.

The first-screen copy is direct and matches the job: “Create a protected ZIP with opening instructions.” The primary action is visible at y=548–598 on desktop and y=464–514 on phone. All three product facts end at y=728 on desktop and y=678 on phone.

## Finding

### F-5-1 — HIGH — Prepared handoff sheet download control loses its action label

**Location:** live `/?demo=1`, after **Create sample handoff**.

The second result card is meant to offer **Download handoff sheet**. In the live prepared result, its visible and accessible label is instead:

```text
where to expect the access phrase.
```

The browser DOM is:

```html
<button id="download-sheet" ...> where to expect the access phrase.</button>
```

The control still downloads `confidential-file-handoff.txt`, and the downloaded sheet itself is realistic and correct for Maya: it names `confidential-file-handoff.zip`, separates the email ZIP route from the text-message access-phrase route, names 7-Zip/Keka/PeaZip, and gives a recovery instruction. That does not repair the user-facing control: a sender cannot tell that the button downloads the handoff sheet, and assistive technology announces a sentence fragment rather than the action.

**Cause in the implementation:** the runtime text-node update around `#kit-recipient` writes the final sentence fragment into the next sibling after its sibling relationships have changed. The live built script contains this mutation, and the source at `src/main.ts` reproduces it.

**Required repair:** update the recipient sentence using a dedicated text element or the containing paragraph, without changing `#download-sheet`. Add a browser regression assertion after packet creation for the visible/accessibility name **Download handoff sheet**, then re-run the full claims suite and this live review.

## Demo, normal, invalid, boundary, and recovery paths

- One click opened the isolated demo at `/?demo=1`. Its first phone viewport showed the persistent **Demo — sample data, nothing is saved** label, `project-update.txt`, `meeting-notes.txt`, Maya, both routes, **Create sample handoff**, **Reset demo**, and **Start for real**.
- Creating the sample displayed the prepared protected-ZIP and handoff-sheet result. Reset cleared the demo record list and restored the sample. The defect above was observed at this exact populated state.
- A normal real-mode flow with `private-tax-summary.txt`, recipient Ravi, and a 12-character phrase produced the packet and persisted the local record after reload.
- Empty submission announced “Fix the marked fields before preparing the protected ZIP.” and focused the file input. A supplied file with a too-short phrase focused the phrase field with the same corrective status. Replacing it with a 12-character phrase recovered successfully.
- A fresh service-worker-controlled phone context reloaded `/?demo=1` offline and created the sample packet.
- The live full-flow request log contained only the product origin and blob downloads. No console or page errors occurred in the normal/demo flows.

## Claims and clean checkout

A fresh clone of `main` at `a9dd814f7f5dc85308d9a1c7547475317009f881` was installed with the documented `npm ci`. Every exact command listed in `.factory/claims.json` was then run independently: **28/28 passed**.

This includes demo separation/reset/exit, AES-256 ZIP creation and wrong/missing phrase rejection, visible ZIP entry names, handoff-sheet routes and compatibility advice, no-recipient verification, offline reload, log fields/export/import/delete/clear, access-phrase exclusion, no sensitive uploads, free-core and Pro boundaries, license handling/cache/rate/no-store/minimal storage, no third-party runtime, and artwork provenance.

The ordinary documented checks also passed in that clean clone:

```text
npm test             PASS (4 Vitest + 10 API tests)
npm run lint         PASS
npm run typecheck    PASS
npm run build        PASS; dist/index.html produced
npm run test:browser PASS (39/39)
```

The clean production build is 171.87 kB JavaScript (71.32 kB gzip) and 15.19 kB CSS (4.26 kB gzip).

## Live structure, accessibility, privacy, and API checks

- `verify-url.sh` passed for the live root: HTTPS 200, no load errors, title, `lang=en`, one h1, main landmark, image alt coverage, and labelled buttons on initial load. Evidence: `.factory/evidence/review-5/verify-url/verify.json`.
- The live route titles and designed pages passed: Privacy, Terms, and Offline return 200 with one h1/main; a deliberate missing URL returns HTTP 404 with “That page is not here.” This expected 404 is not a defect.
- The header, skip link, focus styling, reduced-motion (`scroll-behavior: auto`), local legal pages, robots, sitemap, manifest, PWA service worker, and shared footer were checked. The first Tab stop was the visible skip link on both form factors.
- Root, legal, offline, and 404 accessibility coverage passes in the 39-test Playwright axe integration. The standalone `npx @axe-core/cli` runner could not start its Selenium Chrome session in this container; that runner failure is environmental, not treated as a product claim failure because the installed Playwright axe integration completed successfully.
- All rendered links resolved successfully. The 404 page's own `#main` skip link deliberately retains its 404 status. The hosted Sociobot checkout and Sociobot support link returned 200.
- A fresh browser identity made 21 sequential live POST checks to the same-origin license gateway. Requests 1–20 returned 200 with remaining allowance descending 19→0 and `Cache-Control: no-store`; request 21 returned 429 with `Retry-After: 58` and remaining 0.

## Live candidate comparison

The live root and JavaScript asset byte-match a clean build at documentation SHA `02c47c6` (`main-98YP6wz5.js`). That commit is report-only relative to implementation SHA `479e2c6`; the latter is the last product-code commit. The live runtime therefore contains the reviewed implementation, not a stale alternate product image.

## Earlier findings disposition

| Earlier finding set | Current disposition and evidence |
| --- | --- |
| Review 1: F-1-1 demo, F-1-2 claims, F-1-3 routing/metadata, F-1-4 dead footer, F-1-5 copy | Fixed: populated demo is in the first phone viewport; 28 exact claim checks pass; route metadata/common shell work; all links resolve; current first-screen and headings are plain. |
| Review 2: F-2-1 public security/compatibility claims, F-2-2 AES proof, F-2-3 header, F-2-4 README language | Fixed: the specific visibility/compatibility claims are registered and tested; AES test passes; shared header and route titles pass; current README copy was checked against claim coverage. |
| Review 3: F-3-1 first action, F-3-2–F-3-4 privacy/claims/offline route, F-3-5–F-3-14 minor wording/contact/README issues | Fixed: the desktop and phone first actions are visible; storage/privacy/offline tests pass; offline/404/legal routes have their common structure; current controls and headings use result names. |
| Verification 1–3 core/recovery, billing, demo, deployment findings | Fixed in current checks: normal/invalid/recovery flows work; demo reset/exit claims pass; no off-origin core traffic; live asset is the intended candidate. |
| Verification 4–6 live API allowance, paid-unlock race, clean setup, recipient-sheet wording, first-screen wording | Fixed except for the new separate UI regression: root `npm ci` supports all commands; the 21st live check is 429 with Retry-After; first-use license remains covered by the passing entitlement tests; the sheet's downloaded content and first-screen wording are correct. |
| Verification 7 metadata follow-ups | Fixed: current route titles use Confidential File Handoff and social-preview metadata is present. |
| Review 4 | It reported no findings. Its former PASS is superseded by F-5-1, which appears only after entering the populated result state. |

## Evidence and next step

The evidence is in `.factory/evidence/review-5/verify-url/`. Repair F-5-1, add a post-create accessible-name assertion, deploy it, and repeat the fresh phone/desktop populated-result review. Until then, the verdict remains **FAIL** with **1 finding** and **0 untested claims**.
