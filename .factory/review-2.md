# Adversarial first-read review 2 — Confidential File Handoff

**Reviewed:** 2026-08-28 UTC  
**Live URL:** https://confidential-file-handoff.sociobot.in  
**Verdict: FAIL**

This is a complete cold review, not a diff review. The first screen, demo isolation, offline behavior, accessibility smoke check, and every registered claim command pass. The verdict remains FAIL because public security and compatibility promises remain outside the claims contract, and the AES-256 test does not prove its stated result.

## Cold first read

Fresh Chromium contexts at **390 × 844** and **1440 × 1000**, with no prior browser data, gave the same answer before scrolling:

- **What it does:** creates a protected ZIP and a handoff sheet that tells the recipient how to open it.
- **For whom:** people sending personal files to someone who needs clear opening steps.
- **First click:** **Try it with sample data**, to open a filled sample handoff; **Create a protected ZIP** is the real-file path.

The exact mobile first-screen copy is “Create a protected ZIP with opening instructions.”, “For people sending personal files to recipients who need clear, separate steps for opening them.”, and “Try it with sample data”. The demo’s primary action began at y=683 and ended at y=733 in the 844 px viewport. This passes the first-read and one-click placement checks.

## Findings

### F-2-1 — BLOCKING — Security and compatibility promises are still unlisted claims (recurrence of F-1-2)

**Locations / exact quotes:**

- Builder and landing limits: “ZIP file names remain visible before the access phrase is entered.” and “It does not hide file names: ZIP entry names remain readable.”
- README: “ZIP entry names remain visible before the access phrase is entered.” and “It cannot hide ZIP entry names or secure a compromised device.”
- Privacy and Terms: “ZIP entry names remain visible until you rename them.” and “The tool does not hide ZIP entry names or verify a recipient.”
- Landing compatibility note and README: “The handoff sheet names compatible extractors and tells the recipient what to do if opening fails.” and “The handoff sheet explains what to do when a built-in ZIP tool is incompatible.”

None of the 22 entries in `.factory/claims.json` states or tests ZIP-entry-name visibility, a recipient-sheet compatibility fallback, recipient verification, or device-security limitation. `handoff-sheet-routes` checks the ZIP filename and separate routes only; it never checks the named extractors or fallback instruction. These are reliance claims for a sensitive-file product, not decorative copy. The prior claims finding is therefore only partially fixed.

**Why this fails first-read honesty:** a sender may rely on whether a sensitive filename is exposed, and a recipient may rely on the stated recovery instructions. The page gives definite answers without a claim entry or observable test.

**Concrete fix:** add separate `zip-entry-names-visible` and `handoff-sheet-compatibility` claims with one tagged test each. Create a demo ZIP, prove its entry names can be listed before decryption, and prove the sheet contains 7-Zip, Keka, PeaZip, and the “tell your sender the device and app” fallback. Either add observable tests for the recipient/device limitations or remove those absolute statements from public copy.

### F-2-2 — BLOCKING — The registered AES-256 test would also pass for an unencrypted ZIP

**Location / exact claim:** `.factory/claims.json`, `encrypted-local-zip`: “Creates an AES-256 protected ZIP in the browser.” The test at `tests/release.spec.ts` opens an entry with the known password and asserts that it produces a Blob.

**Why this fails:** the test never attempts a missing or wrong password, never asserts that entries are encrypted, and never inspects the encryption method or strength. A plain ZIP containing the two sample files would satisfy the present assertion. The product code currently requests `encryptionStrength: 3`, but source configuration is not an observable claim test.

**Concrete fix:** extend `@claim:encrypted-local-zip` to assert a wrong password fails and to inspect the downloaded archive with a compatible ZIP reader/tool for AES-256 encryption. Keep the successful-decryption assertion as well. This makes the claimed protection, rather than merely ZIP readability, testable from the sandbox.

### F-2-3 — MINOR — The shared header is not actually consistent across routes (partial F-1-3 closure)

**Location / exact navigation:** the landing and demo header shows **Demo · How it works · Handoff log · Privacy**. `/privacy/` shows **Demo · Terms · Builder**; `/terms/` shows **Demo · Privacy · Builder**; the 404 header shows **Demo · Privacy · Terms**.

**Why this matters:** this contradicts the required common site skeleton. A visitor who follows Privacy loses the visible route back to the handoff log and how-it-works section, while the meaning and order of the short links changes by page.

**Concrete fix:** use one shared header component/markup on root, demo, Privacy, Terms, and 404: wordmark, Demo, How it works, Handoff log, Privacy. Keep Terms in the shared footer. Preserve the existing mobile overflow treatment and add an assertion that all route headers expose the same ordered navigation labels.

### F-2-4 — MINOR — End-user README copy still exposes storage and web-platform jargon (partial F-1-5 closure)

**Location / exact quotes:** “The demo uses the separate `demo:confidential-file-handoff` IndexedDB database.”; “License checks use the same-origin `/api/license/verify` function.”; “Its counter stores only a one-way browser digest, count, and one-minute expiry.”

**Why this matters:** the README’s demo and privacy sections address the sender, yet require knowledge of an implementation database, origin policy, API endpoint, and digest. The earlier review required this jargon to be defined plainly or confined to developer documentation.

**Concrete fix:** write “The demo uses a separate browser database” in the user-facing demo section, then move the exact key and endpoint details to a developer/privacy-implementation subsection. Rewrite the rate-limit line as “It keeps an irreversible browser identifier, a count, and an expiry time.”

## Copy audit

Word counts use whitespace-separated reader-visible tokens; filenames, URLs, and hyphenated terms count as one. All landing and README sentences are listed below. No sentence exceeds 22 words. The four jargon items in F-2-4 are marked `J`; the unregistered reliance statements in F-2-1 are marked `C`. Buttons use result-naming verbs except the required demo-exit control **Start for real**, which is clear in its banner context.

### Landing page

| Words | Sentence | Flag |
| ---: | --- | --- |
| 7 | Create a protected ZIP with opening instructions. | — |
| 15 | For people sending personal files to recipients who need clear, separate steps for opening them. | — |
| 3 | No file upload. | — |
| 5 | Works offline after first visit. | — |
| 9 | Core tools are free; Pro costs US $9 once. | — |
| 4 | Original generated print illustration. | — |
| 7 | Choose files and a ZIP access phrase. | — |
| 8 | Send the protected ZIP and access phrase separately. | — |
| 6 | Record when they confirm opening it. | — |
| 5 | Your browser creates both downloads. | — |
| 14 | It never saves the ZIP access phrase or puts it in the handoff sheet. | — |
| 8 | They are read only to create a ZIP. | — |
| 8 | The handoff log does not save file names. | — |
| 11 | ZIP file names remain visible before the access phrase is entered. | C |
| 11 | Send the protected ZIP and its access phrase by different channels. | — |
| 8 | This app cannot make that choice for you. | — |
| 11 | Buy Pro to add a short note to the handoff sheet. | — |
| 6 | Use a new ZIP access phrase. | — |
| 14 | Save it in your notes or write it down before you close this page. | — |
| 6 | I have saved this access phrase. | — |
| 8 | It will not be saved by this app. | — |
| 5 | Send these two things separately. | — |
| 8 | Send this file using your selected delivery route. | — |
| 7 | It requires the access phrase to open. | — |
| 7 | Send or print this with the ZIP. | — |
| 10 | It tells your recipient where to expect the access phrase. | — |
| 7 | Keep only the recipient, routes, and dates. | — |
| 8 | I sent the protected ZIP and handoff sheet. | — |
| 7 | The recipient confirmed they opened the files. | — |
| 10 | Recipient note: some built-in ZIP tools do not support AES-256. | C |
| 16 | The handoff sheet names compatible extractors and tells the recipient what to do if opening fails. | C |
| 10 | This browser keeps only the recipient, dates, and delivery routes. | — |
| 10 | It does not keep files, file names, or access phrases. | — |
| 4 | No handoffs logged yet. | — |
| 7 | Creating a protected ZIP adds one here. | — |
| 13 | It protects file contents: someone needs the separate access phrase to read them. | — |
| 11 | It does not hide file names: ZIP entry names remain readable. | C |
| 9 | Rename files first if their names reveal sensitive information. | — |
| 3 | It has limits. | — |
| 10 | It cannot verify your recipient or secure a compromised device. | C |
| 12 | It cannot stop forwarding, scan for malware, or guarantee a delivery channel. | C |
| 11 | For urgent or regulated needs, follow your professional or organisation’s requirements. | — |
| 9 | This tool makes no medical, legal, or compliance guarantee. | — |
| 10 | Pro costs US $9 once and adds a personal note. | — |
| 11 | Creating the ZIP, handoff sheet, handoff log, and exports remains free. | — |
| 7 | Create protected ZIP handoffs on your device. | — |
| 4 | Original AI-generated product artwork. | — |

### README

| Words | Sentence | Flag |
| ---: | --- | --- |
| 11 | Create a protected ZIP for people who need clear opening steps. | — |
| 14 | The browser also creates a handoff sheet and keeps a small local handoff log. | — |
| 9 | Creates the AES-256 protected `confidential-file-handoff.zip` in the browser. | — |
| 13 | Creates a handoff sheet that names the ZIP and explains both delivery routes. | — |
| 10 | Stores only the recipient, dates, and selected routes in IndexedDB. | J |
| 10 | Exports the handoff log as JSON and imports valid exports. | — |
| 6 | Works offline after the first visit. | — |
| 14 | The app does not upload selected files, access phrases, file names, or handoff sheets. | — |
| 11 | ZIP entry names remain visible before the access phrase is entered. | C |
| 7 | Rename sensitive file names before adding them. | — |
| 10 | Choose **Try it with sample data** or open `/?demo=1`. | — |
| 14 | The first view shows two fictional files, Maya, both routes, and the create action. | — |
| 9 | The demo uses the separate `demo:confidential-file-handoff` IndexedDB database. | J |
| 9 | It never reads or changes the real handoff log. | — |
| 9 | **Reset demo** clears demo activity and restores the sample. | — |
| 8 | **Start for real** clears demo activity before leaving. | — |
| 7 | See `.factory/demo.md` for the sandbox details. | — |
| 10 | Every reliance claim has one observable test in `.factory/claims.json`. | J |
| 14 | This tool does not transfer files, verify recipients, scan files, or provide professional certification. | C |
| 11 | It cannot hide ZIP entry names or secure a compromised device. | C |
| 14 | The handoff sheet explains what to do when a built-in ZIP tool is incompatible. | C |
| 5 | Requires Node 20 or newer. | — |
| 14 | `npm run build` writes the static site to `dist/`, with `dist/index.html` at its root. | — |
| 15 | Run each command in `.factory/claims.json` from a clean checkout to verify every public claim. | — |
| 4 | Read [Privacy](/privacy/) and [Terms](/terms/). | — |
| 11 | Creating the ZIP, handoff sheet, handoff log, and exports remains free. | — |
| 14 | Pro costs US $9 once and adds a personal note to the handoff sheet. | — |
| 11 | Payment happens on the hosted [Sociobot checkout](https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout), not inside this app. | — |
| 7 | License checks use the same-origin `/api/license/verify` function. | J |
| 10 | It forwards a check to Sociobot and sends `Cache-Control: no-store`. | J |
| 9 | It permits 20 checks per browser in 60 seconds. | — |
| 12 | Its counter stores only a one-way browser digest, count, and one-minute expiry. | J |
| 16 | A browser verdict is reused for less than 24 hours and only for its exact token. | J |
| 8 | This is an Azure Static Web Apps deployment. | — |
| 11 | The static root is `dist/`; `api/` contains the same-origin license gateway. | J |
| 11 | The dithered security-print visual system and asset provenance are in `.factory/design.md`. | — |
| 8 | The original artwork was generated for this product. | — |
| 11 | Core use loads no third-party fonts, scripts, analytics, or icon libraries. | — |

The headings are concrete section names; no generic slogan, marketing adjective, or mood heading was found. Landing terminology is consistent: **protected ZIP**, **handoff sheet**, **handoff log**, **ZIP access phrase**, and **demo**.

## Demo, sandbox, and privacy verification

The cold `/?demo=1` flow passed the visible-demo checks:

- The banner states “Demo — sample data, nothing is saved.” and exposes **Reset demo** and **Start for real**.
- The first viewport shows `project-update.txt`, `meeting-notes.txt`, Maya, Email attachment, Text message, and **Create sample handoff**.
- Creating the sample immediately showed the prepared protected ZIP and handoff sheet. The only IndexedDB database in the demo context was `demo:confidential-file-handoff`.
- Reset hid the prepared kit, restored “2 sample files selected”, and restored “No handoffs logged yet”. Leaving demo returned to `/` after clearing demo activity. Real storage was not accessed by the demo flow.
- The full request log for load, creation, reset, and exit contained only `https://confidential-file-handoff.sociobot.in`. No console or page errors occurred.
- After service-worker control, an offline reload at 390 px succeeded and **Create sample handoff** produced the kit.

## Claims and local quality gates

I created a new local clone at commit `df325ca09efb17fc0294c75745452c82e1fe11ba`, ran `npm ci`, and then ran every command in `.factory/claims.json` individually. All 22 registered commands passed: 19 Playwright claim tests plus `license-rate-limit`, `license-response-no-store`, and `license-rate-storage-minimal`. Every listed `@claim:` tag occurs in exactly one test source. This does not close F-2-1 or F-2-2 because those public promises are unlisted or insufficiently asserted.

The same clean clone also passed:

- `npm test` — 4 Vitest tests and 9 gateway tests.
- `npm run lint` and `npm run typecheck`.
- `npm run build` — `dist/index.html` exists; initial JS is 71.34 kB gzip and CSS is 4.20 kB gzip.

## Structure, routes, and accessibility

Live checks passed for `/`, `/?demo=1`, `/privacy/`, `/terms/`, and a nonexistent route:

- Exact titles, one h1, `main`, descriptions, canonical URLs, OG/Twitter social image, and favicon are present. The missing route returns the styled 404 with HTTP 404.
- Internal navigation to Privacy and browser Back move focus to the new h1 and announce the route title.
- All rendered product, legal, demo, and checkout links resolve. The hosted checkout reaches a 200 Dodo checkout page. The 404 page’s self skip link is an in-page anchor and is not a dead visitor link.
- Axe WCAG 2 A/AA scans at 390 px had zero violations on root, demo, Privacy, Terms, and 404. The deployed pages produced no console errors.
- The designed dithered paper, ink, editorial type, and original print-desk artwork are distinct from a generic SaaS template and match `.factory/design.md`.

No additional AI feature is expected: transmitting confidential file contents to an AI service would contradict the product’s local, offline job. Import/export is already present.

## Earlier findings check

| Earlier finding | Live and code result |
| --- | --- |
| F-1-1 demo first view | Fixed. The populated sample workspace and create action are inside the first mobile viewport. |
| F-1-2 unlisted claims | Partially fixed. The 22 registered claims pass, but F-2-1 records remaining public claims without entries/tests. |
| F-1-3 route metadata/focus/shared shell | Metadata, 404, focus, announcements, and footer are fixed. F-2-3 records the remaining inconsistent header navigation. |
| F-1-4 dead Param Factory link | Fixed. It is non-linked footer text; the remaining links resolve. |
| F-1-5 copy and terminology | Landing copy and terminology are fixed. F-2-4 records remaining end-user README jargon. |

## What would make this perfect

Register and test every remaining security/compatibility statement, make the encryption test prove AES-256 rather than merely a readable archive, use one header on every route, and move browser-storage implementation jargon out of the reader-facing README sections. Then repeat this whole cold review and return PASS only if those checks leave zero findings.
