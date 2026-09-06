# Create a protected ZIP and handoff sheet — review 6

**Verdict: PASS**

**Findings:** 0

**Untested claims:** 0

**Reviewed:** 2026-09-06 UTC

**Live URL:** <https://confidential-file-handoff.sociobot.in/>

**Implementation candidate:** `7a64d7668af332bcb2cc794beb098bebc0252fd7`

**Live documentation/build SHA:** `1ee2db95ca832e22ae35159d806d44dd2b00011a`

**Repository QA baseline:** `1a5106e4f326f52017b58407b0d0f86b8be7cc9d`

The implementation and live documentation/build commits differ only because the later commit records evidence. The live HTML, JavaScript, CSS, and service worker byte-match a build of the implementation candidate made with the live documentation/build SHA.

## Job, audience, and first action

Fresh browser contexts opened the live root at 1366 × 768 and 390 × 844 before scrolling.

- **Job:** Create a protected ZIP and give the recipient clear opening instructions.
- **Audience:** People sending personal files to recipients who need separate steps for opening them.
- **First action:** **Try it with sample data**, which opens Maya’s filled sample handoff.

Both screens showed the plain headline, audience sentence, primary action, and all three facts without scrolling. The last required item ended at 728 px on desktop and 678 px on phone. No load, page, or console error was observed.

## One-click sample and main paths

The live `/?demo=1` sample showed the persistent **Demo — sample data, nothing is saved** label, Maya, `project-update.txt`, `meeting-notes.txt`, the two distinct delivery routes, **Create sample handoff**, **Reset demo**, and **Start for real**. Creating it exposed a plainly named **Download handoff sheet** button on both desktop and dark/reduced-motion phone. Reset hid the prepared result and restored the shipped sample; the exact clean-state reset and exit-discard claims also passed.

The declared browser tests cover normal creation, invalid submission and corrective focus, 12-character phrase, zero-byte and 1 MiB files, 80-character recipient, duplicate filenames, encrypted download, wrong-phrase rejection, acknowledgement after reload, rejected secret-bearing import, storage recovery, offline reload, service-worker update, keyboard operation, touch targets, and legal/404 routes. The fresh verification-8 evidence also exercises these live paths on this same runtime image.

## Declared claims from a clean checkout

I created a detached checkout at `1a5106e`, ran the documented `npm ci`, and ran every exact command in `.factory/claims.json` separately. All **28/28** passed:

| Claims | Result |
| --- | --- |
| Demo sandbox, reset, exit discard | PASS |
| AES-256 ZIP, visible entry names, handoff-sheet compatibility, recipient verification boundary, offline reload, separate routes | PASS |
| Local log fields, export, import, deletion, site-storage clearing, access-phrase exclusion | PASS |
| No sensitive uploads, free core tools, Pro price and entitlement, hosted-payment boundary, revoked-license lock | PASS |
| License cache, token handling, live-rate-limit unit contract, no-store, minimal rate storage | PASS |
| No third-party runtime and artwork provenance | PASS |

The longer `site-storage-clear` command was allowed to finish independently after the terminal tool’s 30-second output limit; Playwright recorded a passed run. Every claim ID has one tagged test. I reviewed the landing page, populated result, Privacy, Terms, README, demo notes, and design notes against the claims list. No public reliance claim was missing a declared, observable test.

## Quality checks

From the detached checkout:

```text
npm ci                 PASS — 188 packages; 0 vulnerabilities
npm test               PASS — 4 Vitest tests and 10 gateway tests
npm run lint           PASS
npm run typecheck      PASS
npm run build          PASS — dist/index.html produced
npm run test:browser   PASS — 41/41 Chromium tests
```

The built JavaScript is 171,688 bytes and CSS is 15,180 bytes. Both are within the static-product budgets.

## Live checks

- `verify-url.sh` passed root, demo, Privacy, Terms, and Offline: HTTPS 200, route title, `lang=en`, one h1, main landmark, image alt coverage, labelled buttons, and no load errors.
- A populated live demo on a 390 px dark, reduced-motion phone had zero WCAG 2 A/AA axe violations, no horizontal overflow, `scroll-behavior: auto`, and the accessible text **Download handoff sheet**.
- The intentional missing route returned HTTP 404 with the designed recovery page. This expected status is not a defect.
- The recent independent evidence confirms live offline creation, service-worker update handling, link crawl, legal routes, and Lighthouse 97 Performance / 100 Accessibility / 100 Best Practices / 100 SEO for this image.
- A fresh live client made 21 sequential POST requests to the license gateway using an invalid test token. Requests 1–20 returned 200 with allowance 19 through 0 and `Cache-Control: no-store`; request 21 returned 429 with `Retry-After: 58`.

This is a static local-first PWA. It has no tenant data store, server-side product records, health route, or restart-persistence surface. Browser records persist across reload; the only server function is the license gateway, whose live allowance and recovery behavior are covered above. No credential was used or recorded.

## Earlier findings

All earlier findings, including minor items, remain closed:

| Earlier set | Current disposition |
| --- | --- |
| Verification 1 core/recovery, PWA, headers, checkout, rate limit, metadata | Closed by current regression suite and live gateway/route checks. |
| Verification 2–4 claims, demo isolation, paid-token race/cache, copy, routing, live allowance | Closed by 28 explicit claims, entitlement tests, demo isolation tests, and fresh live allowance result. |
| Verification 5 clean root install | Closed: documented root `npm ci` supports every test and claim command. |
| Verification 6 gateway 500, wrong sheet, weak first screen, footer link | Closed: current gateway, sheet, first screen, and links pass. |
| Verification 7 route titles and social-image size | Closed: current route titles use Confidential File Handoff and the 1200 × 630 social asset is present. |
| Reviews 1–3 demo placement, claim completeness, route shell, copy, README terms, desktop action, offline route | Closed by current first-screen, claim, route, copy-audit, and offline checks. |
| Review 5 F-5-1 and repair-6 dark prepared state | Closed: the sheet control remains named and readable in the populated dark phone state. |

Review 4 had no findings. No earlier finding is open.

## Evidence

Fresh route evidence is in `.factory/evidence/review-6-live/`. Prior authoritative evidence is in `.factory/evidence/verification-8/`. The live build comparison used the recorded production hashes for `index.html`, `main-DaRvjJ_5.js`, `main-GUSyI-4G.css`, and `sw.js`.

**Final result: PASS — 0 findings, 0 untested claims.**
