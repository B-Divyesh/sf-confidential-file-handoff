# Adversarial first-read review 3 — Confidential File Handoff

**Reviewed:** 2026-08-29 UTC  
**Live URL:** https://confidential-file-handoff.sociobot.in  
**Repository commit reviewed:** `73c036a1eec776817f483cff9f16d05b3f43927d`  
**Verdict: FAIL**

This was a complete cold review, not a diff review. The 390 px first screen, demo sandbox, registered claim tests, intended-link crawl, build, and automated accessibility checks pass. The product still fails because a common desktop viewport hides the first action, the Privacy page contains unlisted and misleading claims, and the offline route does not have the route metadata and focus behavior previously reported as fixed.

## Cold first read

Fresh Chromium contexts were used with no prior site data.

At **390 × 844**, before scrolling, I could answer all three questions:

- **What it does:** creates a protected ZIP and opening instructions.
- **For whom:** people sending personal files to recipients who need clear, separate opening steps.
- **What to click first:** **Try it with sample data**.

The exact copy was “Create a protected ZIP with opening instructions.”, “For people sending personal files to recipients who need clear, separate steps for opening them.”, and “Try it with sample data”. All three facts were also visible.

At **1440 × 900**, the same answers were available, but the primary action was at y=805–854 and the three facts began below the viewport at y=932. At the common **1366 × 768** desktop size, the audience sentence ended at y=770 and **Try it with sample data** began at y=794. The visitor therefore could not see what to click first without scrolling. This is blocking under the first-screen rule; see F-3-1.

## Findings

### F-3-1 — BLOCKING — The first action falls below a common desktop viewport

**Location / quote:** landing hero, **Try it with sample data**. At 1366 × 768 it begins at y=794; the audience sentence itself ends at y=770. At 1280 × 720 the action begins at y=761. Even at 1440 × 900, the three required facts begin at y=932.

**Why this fails:** a first-time laptop visitor cannot answer “what should I click first?” from the first screen. The oversized heading and top spacing consume the viewport. Passing at 1440 × 900 by 46 px is not a robust desktop first screen.

**Concrete fix:** reduce the desktop hero’s top space and heading size so the headline, audience sentence, primary action, and three facts fit at 1366 × 768. Add a browser assertion for those elements’ bounding boxes at 1366 × 768, not only the present 390 px demo assertion.

### F-3-2 — BLOCKING — Privacy says a license token stays in the browser, but the app sends it to the gateway

**Location / exact quote:** `/privacy/`, “A license token stays in this browser.” In `src/main.ts`, `verifyLicense()` sends the token in `GET /api/license/verify?license=…`. No `.factory/claims.json` entry states or tests the token’s storage and transmission boundary.

**Why this fails:** “stays in this browser” means the token does not leave the browser. The implementation transmits it. This is a privacy-sensitive, unlisted claim and a recurrence of the general completeness failure in F-1-2.

**Concrete fix:** replace it with “The license token is stored in this browser and sent to this product’s license gateway when you check it.” Add a `license-token-handling` claim whose test records storage and the exact request destination. Prefer a POST body or authorization header so the token is not placed in a URL.

### F-3-3 — BLOCKING — Handoff-log deletion and browser-storage clearing are unlisted claims

**Location / exact quote:** `/privacy/`, “You can export, import, or delete the handoff log. Clearing this site’s browser storage removes it.” Export and import have claim entries; delete and clearing site storage do not.

**Why this fails:** a sender handling sensitive records may rely on being able to remove them. The UI has **Delete log entry**, but there is no uniquely tagged sandbox test for deletion or browser-storage clearing. This is another recurrence of F-1-2.

**Concrete fix:** add separate `local-log-delete` and `site-storage-clear` entries to `.factory/claims.json`. Test deletion after reload and test that clearing site storage removes real and demo databases plus license state, or remove the unsupported sentence.

### F-3-4 — BLOCKING — The offline route was omitted from the claimed route-shell repair

**Location / evidence:** live `/offline.html` and `public/offline.html`.

- It has no canonical URL, Open Graph metadata, Twitter metadata, apple-touch icon, or manifest link.
- It does not load `route-nav.js`, has no `#route-status`, and its h1 is not focusable. Clicking **Privacy** from it leaves focus on `BODY` and announces nothing.
- Its footer says “Built by Param Factory · version 1.0.0”; the live app footer says “Original AI-generated product artwork. Built by Param Factory · build local”. The supposedly shared footer is not consistent, and `build local` is not a useful production build identifier.
- The route, metadata, header, focus, link-crawl, and axe matrices in `tests/release.spec.ts` omit `/offline.html`, so all 36 tests pass without detecting this.

**Why this fails:** F-1-3 was marked fixed with the explicit claim that the offline route had complete metadata and the shared shell. Live and code inspection show that claim was not verified. Navigation from the recovery page also fails the required focus/announcement behavior.

**Concrete fix:** give `/offline.html` the complete shared head, `route-nav.js`, focusable h1, live region, and identical footer. Supply a real deployment build/version value on every route. Add `/offline.html` to every route metadata, navigation, focus, crawl, mobile-overflow, and axe test matrix.

### F-3-5 — MINOR — A result heading does not make sense out of context

**Location / exact quote:** prepared handoff h2, “Send these two things separately.”

**Why this fails:** a screen-reader heading list does not identify what “these two things” are.

**Concrete fix:** “Send the protected ZIP and handoff sheet separately.”

### F-3-6 — MINOR — The compatibility sentence uses unexplained jargon

**Location / exact quote:** landing page, “If a built-in ZIP tool cannot open it, the handoff sheet names three compatible extractors and a reporting step.”

**Why this fails:** “compatible extractors” and “reporting step” do not tell a non-technical recipient what they will do.

**Concrete fix:** “If your ZIP app cannot open it, the handoff sheet names three apps to try and what to report.”

### F-3-7 — MINOR — The acknowledgement heading is formal jargon

**Location / exact quote:** prepared handoff h3, “Manual acknowledgement”.

**Why this fails:** it does not name the concrete task in the section.

**Concrete fix:** “Record sent and opened status”.

### F-3-8 — MINOR — The update button does not name its result

**Location / exact quote:** update notice button, “Refresh”, beside “A newer version is ready.”

**Why this fails:** “Refresh” is a generic browser action and does not say that the new version will load.

**Concrete fix:** “Load the new version”.

### F-3-9 — MINOR — The Privacy contact instruction has no usable contact path

**Location / exact quote:** `/privacy/`, “Contact the operator through Sociobot for privacy questions.” There is no link, address, or form.

**Why this fails:** the instruction tells a visitor to contact someone without telling them where or how.

**Concrete fix:** link “Contact Sociobot support” to a verified support URL or provide a monitored email address.

### F-3-10 — MINOR — README uses “JSON” without explaining the user outcome

**Location / exact quote:** README, “Exports the handoff log as JSON and imports valid exports.”

**Why this fails:** the file format is developer terminology; the user benefit is a restorable backup.

**Concrete fix:** “Exports a handoff-log backup file and imports valid backups.” Add “JSON” in parentheses only if format detail is needed.

### F-3-11 — MINOR — README exposes an implementation database name without a plain explanation

**Location / exact quote:** README, “Demo data uses the IndexedDB database `demo:confidential-file-handoff`; real data uses `confidential-file-handoff`.”

**Why this fails:** “IndexedDB” is unexplained platform jargon.

**Concrete fix:** “Demo and real records use separate browser databases: `demo:confidential-file-handoff` and `confidential-file-handoff`.”

### F-3-12 — MINOR — README describes caching with protocol jargon

**Location / exact quote:** README, “License checks use the same-origin `/api/license/verify` function, which sends `Cache-Control: no-store`.”

**Why this fails:** “same-origin” and the header value require web-platform knowledge.

**Concrete fix:** “License checks go through `/api/license/verify` on this site. Its responses tell browsers and proxies not to cache them.”

### F-3-13 — MINOR — README deploy wording assumes infrastructure jargon

**Location / exact quote:** README, “The static root is `dist/`; `api/` contains the same-origin license gateway.”

**Why this fails:** “static root”, “same-origin”, and “gateway” are not explained.

**Concrete fix:** “Deploy the files in `dist/`. Deploy `api/` with them to handle license checks on the same site.”

### F-3-14 — MINOR — README design wording is more abstract than useful

**Location / exact quote:** README, “The dithered security-print visual system and asset provenance are in `.factory/design.md`.”

**Why this fails:** “visual system” and “asset provenance” are design jargon.

**Concrete fix:** “`.factory/design.md` documents the print-style design and where its artwork came from.”

## Copy audit

Counts use whitespace-separated reader-visible words; hyphenated terms, paths, and filenames count as one. No sentence exceeds 22 words, and no banned marketing adjective appears. Flags correspond to findings above.

### Landing page sentences

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
| 11 | ZIP file names remain visible before the access phrase is entered. | — |
| 11 | Send the protected ZIP and its access phrase by different channels. | — |
| 8 | This app cannot make that choice for you. | — |
| 11 | Buy Pro to add a short note to the handoff sheet. | — |
| 6 | Use a new ZIP access phrase. | — |
| 14 | Save it in your notes or write it down before you close this page. | — |
| 6 | I have saved this access phrase. | — |
| 8 | It will not be saved by this app. | — |
| 5 | Send these two things separately. | F-3-5 |
| 8 | Send this file using your selected delivery route. | — |
| 7 | It requires the access phrase to open. | — |
| 7 | Send or print this with the ZIP. | — |
| 10 | It tells your recipient where to expect the access phrase. | — |
| 7 | Keep only the recipient, routes, and dates. | — |
| 8 | I sent the protected ZIP and handoff sheet. | — |
| 7 | The recipient confirmed they opened the files. | — |
| 19 | If a built-in ZIP tool cannot open it, the handoff sheet names three compatible extractors and a reporting step. | F-3-6 |
| 10 | This browser keeps only the recipient, dates, and delivery routes. | — |
| 10 | It does not keep files, file names, or access phrases. | — |
| 4 | No handoffs logged yet. | — |
| 7 | Creating a protected ZIP adds one here. | — |
| 13 | It protects file contents: someone needs the separate access phrase to read them. | — |
| 11 | It does not hide file names: ZIP entry names remain readable. | — |
| 9 | Rename files first if their names reveal sensitive information. | — |
| 14 | It does not verify recipients: you enter the name and choose both routes yourself. | — |
| 11 | For urgent or regulated needs, follow your professional or organisation’s requirements. | — |
| 7 | This tool does not replace those requirements. | — |
| 10 | Pro costs US $9 once and adds a personal note. | — |
| 11 | Creating the ZIP, handoff sheet, handoff log, and exports remains free. | — |
| 7 | Create protected ZIP handoffs on your device. | — |
| 4 | Original AI-generated product artwork. | — |
| 5 | A newer version is ready. | — |

The demo’s first-view sentences are also within the cap: “Demo — sample data, nothing is saved.” (6), “This demo uses a separate browser space.” (7), “Create Maya’s sample handoff.” (4), and “Review the filled details, then create the protected ZIP and handoff sheet.” (12).

### README sentences

| Words | Sentence | Flag |
| ---: | --- | --- |
| 11 | Create a protected ZIP for people who need clear opening steps. | — |
| 14 | The browser also creates a handoff sheet and keeps a small local handoff log. | — |
| 8 | Creates the AES-256 protected `confidential-file-handoff.zip` in the browser. | — |
| 13 | Creates a handoff sheet that names the ZIP and explains both delivery routes. | — |
| 12 | Stores only the recipient, dates, and selected routes in a browser database. | — |
| 10 | Exports the handoff log as JSON and imports valid exports. | F-3-10 |
| 6 | Works offline after the first visit. | — |
| 14 | The app does not upload selected files, access phrases, file names, or handoff sheets. | — |
| 11 | ZIP entry names remain visible before the access phrase is entered. | — |
| 7 | Rename sensitive file names before adding them. | — |
| 9 | Choose **Try it with sample data** or open `/?demo=1`. | — |
| 14 | The first view shows two fictional files, Maya, both routes, and the create action. | — |
| 7 | The demo uses a separate browser database. | — |
| 9 | It never reads or changes the real handoff log. | — |
| 9 | **Reset demo** clears demo activity and restores the sample. | — |
| 8 | **Start for real** clears demo activity before leaving. | — |
| 6 | See `.factory/demo.md` for the sandbox details. | — |
| 9 | Every reliance claim has one observable test in `.factory/claims.json`. | F-3-2, F-3-3 |
| 6 | This tool does not verify recipients. | — |
| 11 | ZIP entry names remain visible before the access phrase is entered. | — |
| 7 | Rename sensitive file names before adding them. | — |
| 11 | If opening fails, the handoff sheet names 7-Zip, Keka, and PeaZip. | — |
| 10 | It asks the recipient to report their device and app. | — |
| 5 | Requires Node 20 or newer. | — |
| 14 | `npm run build` writes the static site to `dist/`, with `dist/index.html` at its root. | — |
| 14 | Run each command in `.factory/claims.json` from a clean checkout to verify every public claim. | — |
| 4 | Read Privacy and Terms. | — |
| 11 | Creating the ZIP, handoff sheet, handoff log, and exports remains free. | — |
| 14 | Pro costs US $9 once and adds a personal note to the handoff sheet. | — |
| 11 | Payment happens on the hosted Sociobot checkout, not inside this app. | — |
| 9 | License checks pass through this product before reaching Sociobot. | — |
| 4 | Responses are not cached. | — |
| 10 | The gateway permits 20 checks per browser in 60 seconds. | — |
| 12 | It keeps an irreversible browser identifier, a count, and a one-minute expiry. | — |
| 16 | A browser result is reused for less than 24 hours and only for its exact token. | — |
| 11 | Demo data uses the IndexedDB database `demo:confidential-file-handoff`; real data uses `confidential-file-handoff`. | F-3-11 |
| 11 | License checks use the same-origin `/api/license/verify` function, which sends `Cache-Control: no-store`. | F-3-12 |
| 8 | This is an Azure Static Web Apps deployment. | — |
| 11 | The static root is `dist/`; `api/` contains the same-origin license gateway. | F-3-13 |
| 11 | The dithered security-print visual system and asset provenance are in `.factory/design.md`. | F-3-14 |
| 8 | The original artwork was generated for this product. | — |
| 11 | Core use loads no third-party fonts, scripts, analytics, or icon libraries. | — |

### Headings, controls, and terminology

Landing and README headings are concrete except **Send these two things separately** (F-3-5) and **Manual acknowledgement** (F-3-7). Controls use result-naming verbs except **Refresh** (F-3-8). The required **Start for real** is clear in the demo banner. Landing terminology is otherwise consistent:

| Concept | Product term |
| --- | --- |
| ZIP archive | protected ZIP |
| Recipient document | handoff sheet |
| Delivery methods | routes |
| Local history | handoff log |
| Access code | ZIP access phrase |
| Sample environment | demo |

## Demo and sandbox verification

The demo itself passes:

- One click on **Try it with sample data** opens `/?demo=1`.
- The first 390 × 844 viewport shows the persistent “Demo — sample data, nothing is saved.” banner, **Reset demo**, **Start for real**, Maya, `project-update.txt`, `meeting-notes.txt`, Email attachment, Text message, and **Create sample handoff**.
- Creating the sample shows the protected ZIP, handoff sheet, and Maya log record.
- After the asynchronous operation completed, **Reset demo** hid the result, emptied the demo log, and restored the sample fields. **Start for real** cleared the demo log before navigation; revisiting the demo showed an empty log.
- Demo storage is `demo:confidential-file-handoff`; real storage is `confidential-file-handoff`. The registered isolation test seeded a real record and confirmed demo actions did not alter it.
- The live load/create/reset/exit request log contained only the product origin and a same-origin blob worker. There were no off-origin requests.
- The registered offline test reloaded the controlled demo offline and created the sample handoff.

## Claims verification

Every command in `.factory/claims.json` was run separately from the clean tracked checkout after `npm ci`. All **25/25 registered claims passed**, and every `@claim:<id>` tag occurs exactly once in test source.

| Claim | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `demo-reset` | PASS |
| `demo-exit-discard` | PASS |
| `encrypted-local-zip` | PASS |
| `zip-entry-names-visible` | PASS |
| `handoff-sheet-compatibility` | PASS |
| `no-recipient-verification` | PASS |
| `offline-after-first-visit` | PASS |
| `handoff-sheet-routes` | PASS |
| `local-log-fields` | PASS |
| `local-log-export` | PASS |
| `local-log-import` | PASS |
| `access-phrase-excluded` | PASS |
| `no-sensitive-uploads` | PASS |
| `free-core-tools` | PASS |
| `pro-price` | PASS |
| `pro-note-entitlement` | PASS |
| `payment-provider-boundary` | PASS |
| `revoked-license-lock` | PASS |
| `license-cache-ttl` | PASS |
| `license-rate-limit` | PASS |
| `license-response-no-store` | PASS |
| `license-rate-storage-minimal` | PASS |
| `no-third-party-runtime` | PASS |
| `artwork-provenance` | PASS |

F-3-2 and F-3-3 remain blocking because they are public reliance statements with no registered claim or test. A green result for the listed set cannot prove completeness.

## Earlier-finding audit

I read `.factory/review-1.md`, `.factory/review-2.md`, `.factory/polish-1.md`, `.factory/polish-2.md`, and the prior `.factory/handoff.md`, then checked each finding live and in code.

| Earlier finding | Live and code result |
| --- | --- |
| F-1-1 — demo not in use after one click | Fixed. The sample, routes, and action are in the first 390 px viewport; Reset and exit isolation work. |
| F-1-2 — reliance claims unlisted | **Not fully fixed.** The previously enumerated claims were added, but Privacy still has the unlisted and misleading token claim plus unlisted deletion/clearing claims. Reopened as F-3-2 and F-3-3. |
| F-1-3 — route identity, metadata, focus, and shell | **Not fully fixed.** Root, Demo, Privacy, Terms, and 404 pass; `/offline.html` does not. The footer also differs between app and static routes. Reopened as F-3-4. |
| F-1-4 — dead Param Factory link | Fixed. Attribution is plain text, and every intended rendered link returned 200 after redirects. |
| F-1-5 — earlier copy and terminology flags | Fixed for the exact quoted copy. New plain-language issues are F-3-5 through F-3-14. |
| F-2-1 — missing filename, compatibility, and recipient claims | Fixed for those exact claims. Their three registered commands pass. Claims completeness still fails under F-3-2 and F-3-3. |
| F-2-2 — AES test did not prove encryption | Fixed. The test checks AES strength 3, missing/wrong phrase failure, and successful decryption. |
| F-2-3 — headers differed across routes | Fixed for Root, Demo, Privacy, Terms, and 404. Their ordered labels match. The broader offline shell failure is F-3-4. |
| F-2-4 — reader sections exposed platform jargon | Fixed for the exact reader-facing locations. Remaining jargon in README implementation/design copy is listed separately. |

## Structure, accessibility, links, and visual identity

- Root, Demo, Privacy, Terms, and 404 have route-specific titles, one h1, `lang=en`, a main landmark, descriptions, canonical URLs, OG/Twitter metadata, favicon, and the common header. The unknown route returns the designed page with HTTP 404.
- Root → Privacy and browser Back focus the new h1 and update the polite live region. Offline → Privacy fails this check under F-3-4.
- The crawl found no dead intended product, legal, demo, or checkout link. The checkout redirected to a 200 Dodo-hosted page.
- Live axe WCAG 2 A/AA scans reported zero violations on Root, Demo, Privacy, Terms, Offline, and 404 at 390 px. There was no horizontal overflow and no product-page console error. The expected failed-document console message appeared on the intentional HTTP 404.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the full 36-test Playwright suite pass. `dist/index.html` exists. Initial JavaScript is 71.30 kB gzip and CSS is 4.20 kB gzip.
- The dithered paper texture, ink palette, editorial type, asymmetric desk illustration, and perforated rules match `.factory/design.md` and are visually distinct from a generic SaaS template.

## Missed leverage

No AI feature is justified. Sending confidential file contents to an AI gateway would conflict with the local/offline job, and no useful model step is implied by the brief. Import and export already exist. Sync would contradict the stated local-only storage model unless introduced as a separate, explicit trust decision. No provider key is embedded in product code.

## What would make this perfect

Fit the entire first-screen contract into a 1366 × 768 desktop viewport; state and test the real license-token boundary; register deletion and storage-clearing claims; bring the offline page into the complete shared route shell and test matrix; unify the production footer/build identifier; replace the four unclear landing controls/headings; provide an actual privacy contact route; and rewrite the five flagged README jargon sentences. Re-run every registered claim and the complete cold review only after those changes. The acceptance target remains zero findings.
