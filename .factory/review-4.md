# Adversarial first-read review 4 — Confidential File Handoff

**Reviewed:** 2026-08-29 UTC  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verdict: PASS**

This was a fresh, full review of the deployment and current repository, not a diff review. There are zero findings.

## Cold first read

Fresh Chromium contexts were used at 390 × 844 and 1366 × 768 before scrolling.

- **What it does:** creates a protected ZIP and gives the recipient separate opening instructions.
- **For whom:** people sending personal files to a recipient who needs clear steps to open them.
- **First click:** **Try it with sample data**; it opens Maya's filled sample handoff.

The exact first-screen copy is “Create a protected ZIP with opening instructions.”, “For people sending personal files to recipients who need clear, separate steps for opening them.”, and “Try it with sample data”. At 390 px the primary action occupies y=464–514 and all three facts end at y=678. At 1366 × 768 it occupies y=548–598 and the facts end at y=728. The first-screen contract is satisfied on both checks.

## Demo and sandbox

One click opened `/?demo=1`. Its first mobile viewport showed the persistent “Demo — sample data, nothing is saved.” banner, fictional files `project-update.txt` and `meeting-notes.txt`, recipient Maya, email and text-message routes, and **Create sample handoff** at y=683–733. The demo workspace is immediately usable rather than another marketing screen.

`demo:confidential-file-handoff` and `confidential-file-handoff` are separate browser databases. The registered clean-state tests verified the demo does not read or change real records, **Reset demo** restores the sample and clears demo activity, and **Start for real** discards demo activity. The demo request log was same-origin/blob only; the offline claim test reloads the controlled demo while offline and creates the sample handoff.

## Claims

Read `.factory/claims.json`: 28 claims, each with exactly one `@claim:` tag. A clean clone at `/tmp/confidential-file-handoff-review4.59VcdU` was installed with `npm ci`; every listed command was run independently. All 28 passed. This includes AES-256 archive metadata plus wrong/missing phrase failures, separate-route handoff-sheet content, demo isolation/reset/exit, local-log import/export/delete/clear, request logging, offline reload, Pro boundaries, license handling/rate limits, no third-party runtime, and artwork provenance.

The live landing and README reliance copy was matched to those entries. No unlisted claim was found. No provider or raw model key is embedded. An AI feature is not missing: transmitting confidential file contents for an AI step would conflict with the stated local-first task, while import/export already exist.

## Copy audit

Word counts treat contractions, hyphenated terms, file names, and `US $9` as one word each. The inventory below covers every sentence rendered by the landing flow (including the prepared-handoff state) and every README sentence. No sentence exceeds 22 words. No banned marketing adjective, unexplained metaphor heading, or inconsistent product term was found.

### Landing flow

| Sentence | Words |
| --- | ---: |
| Create a protected ZIP with opening instructions. | 7 |
| For people sending personal files to recipients who need clear, separate steps for opening them. | 15 |
| No file upload. | 3 |
| Works offline after first visit. | 5 |
| Core tools are free; Pro costs US $9 once. | 9 |
| Original generated print illustration. | 4 |
| Choose files and a ZIP access phrase. | 7 |
| Send the protected ZIP and access phrase separately. | 8 |
| Record when they confirm opening it. | 6 |
| Your browser creates both downloads. | 5 |
| It never saves the ZIP access phrase or puts it in the handoff sheet. | 14 |
| They are read only to create a ZIP. | 8 |
| The handoff log does not save file names. | 8 |
| ZIP file names remain visible before the access phrase is entered. | 11 |
| Send the protected ZIP and its access phrase by different channels. | 11 |
| This app cannot make that choice for you. | 8 |
| Buy Pro to add a short note to the handoff sheet. | 11 |
| Use a new ZIP access phrase. | 6 |
| Save it in your notes or write it down before you close this page. | 14 |
| I have saved this access phrase. | 6 |
| It will not be saved by this app. | 8 |
| Send the protected ZIP and handoff sheet separately. | 8 |
| Send this file using your selected delivery route. | 8 |
| It requires the access phrase to open. | 7 |
| Send or print this with the ZIP. | 7 |
| It tells your recipient where to expect the access phrase. | 10 |
| Keep only the recipient, routes, and dates. | 7 |
| I sent the protected ZIP and handoff sheet. | 8 |
| The recipient confirmed they opened the files. | 7 |
| If your ZIP app cannot open it, the handoff sheet names three apps to try and what to report. | 19 |
| This browser keeps only the recipient, dates, and delivery routes. | 10 |
| It does not keep files, file names, or access phrases. | 10 |
| No handoffs logged yet. | 4 |
| Creating a protected ZIP adds one here. | 7 |
| It protects file contents: someone needs the separate access phrase to read them. | 13 |
| ZIP entry names remain readable. | 5 |
| Rename files first if their names reveal sensitive information. | 9 |
| You enter the name and choose both routes yourself. | 9 |
| For urgent or regulated needs, follow your professional or organisation’s requirements. | 11 |
| This tool does not replace those requirements. | 7 |
| Pro costs US $9 once and adds a personal note. | 10 |
| Creating the ZIP, handoff sheet, handoff log, and exports remains free. | 11 |
| Create protected ZIP handoffs on your device. | 7 |
| Original AI-generated product artwork. | 4 |
| A newer version is ready. | 5 |

The contextual headings name their sections: **Protected ZIP builder**, **Prepare the ZIP and handoff sheet**, **Review the local handoff log**, **What the protected ZIP does and does not protect**, and **Add a personal note to the handoff sheet**. Buttons name their outcomes: **Try it with sample data**, **Create a protected ZIP**, **Create protected ZIP and handoff sheet**, **Download protected ZIP**, **Download handoff sheet**, **Export handoff log**, **Import handoff log**, **Reset demo**, and **Start for real**. The only compact controls are still result-specific: **Make an access phrase**, **Print the sheet**, **Restore Pro license**, and **Load the new version**.

### README

| Sentence | Words |
| --- | ---: |
| Create a protected ZIP for people who need clear opening steps. | 11 |
| The browser also creates a handoff sheet and keeps a small local handoff log. | 14 |
| Creates the AES-256 protected `confidential-file-handoff.zip` in the browser. | 8 |
| Creates a handoff sheet that names the ZIP and explains both delivery routes. | 13 |
| Stores only the recipient, dates, and selected routes in a browser database. | 12 |
| Exports a handoff-log backup file and imports valid backups (JSON). | 10 |
| Works offline after the first visit. | 6 |
| The app does not upload selected files, access phrases, file names, or handoff sheets. | 14 |
| ZIP entry names remain visible before the access phrase is entered. | 11 |
| Rename sensitive file names before adding them. | 7 |
| Choose **Try it with sample data** or open `/?demo=1`. | 9 |
| The first view shows two fictional files, Maya, both routes, and the create action. | 14 |
| The demo uses a separate browser database. | 7 |
| It never reads or changes the real handoff log. | 9 |
| **Reset demo** clears demo activity and restores the sample. | 9 |
| **Start for real** clears demo activity before leaving. | 8 |
| See `.factory/demo.md` for the sandbox details. | 6 |
| Every reliance claim has one observable test in `.factory/claims.json`. | 9 |
| This tool does not verify recipients. | 6 |
| ZIP entry names remain visible before the access phrase is entered. | 11 |
| Rename sensitive file names before adding them. | 7 |
| If opening fails, the handoff sheet names 7-Zip, Keka, and PeaZip. | 11 |
| It asks the recipient to report their device and app. | 10 |
| Requires Node 20 or newer. | 5 |
| `npm run build` writes the static site to `dist/`, with `dist/index.html` at its root. | 14 |
| Run each command in `.factory/claims.json` from a clean checkout to verify every public claim. | 14 |
| Read Privacy and Terms. | 4 |
| Creating the ZIP, handoff sheet, handoff log, and exports remains free. | 11 |
| Pro costs US $9 once and adds a personal note to the handoff sheet. | 14 |
| Payment happens on the hosted Sociobot checkout, not inside this app. | 11 |
| License checks pass through this product before reaching Sociobot. | 9 |
| Responses are not cached. | 4 |
| The gateway permits 20 checks per browser in 60 seconds. | 10 |
| It keeps an irreversible browser identifier, a count, and a one-minute expiry. | 12 |
| A browser result is reused for less than 24 hours and only for its exact token. | 16 |
| Demo and real records use separate browser databases: `demo:confidential-file-handoff` and `confidential-file-handoff`. | 11 |
| License checks go through `/api/license/verify` on this site. | 8 |
| Its responses tell browsers and proxies not to cache them. | 10 |
| Deploy the files in `dist/`. | 5 |
| Deploy `api/` with them to handle license checks on the same site. | 12 |
| `.factory/design.md` documents the print-style design and where its artwork came from. | 11 |
| The original artwork was generated for this product. | 8 |
| Core use loads no third-party fonts, scripts, analytics, or icon libraries. | 11 |

## Structure, accessibility, and visual identity

The live root, demo, Privacy, Terms, offline page, and HTTP 404 have a route-specific title, description, canonical URL, Open Graph/Twitter metadata, favicon, one h1, main landmark, shared header/footer, and consistent navigation. The actual missing route returns 404 with a styled recovery page. `robots.txt` and `sitemap.xml` are present. Rendered internal links and the hosted checkout/support links resolved successfully (200; checkout redirects to its hosted Dodo page).

From `/offline.html` to Privacy and from Demo back to Privacy, focus lands on the new h1 and the polite route announcement is set. The root load recorded no console errors. The dithered warm-paper/security-print treatment, illustrated packet, serif display type, and inked rules are product-specific and visibly distinct from a generic SaaS template. It matches the stated design direction.

The full browser suite includes axe coverage and passed. The build honours reduced motion, has visible focus styling, uses 44 px controls, and produced 71.32 KB gzip JavaScript and 4.26 KB gzip CSS.

## Earlier findings

Every prior finding was reconfirmed fixed on the live deployment and source:

| Earlier ID | Confirmation |
| --- | --- |
| F-1-1 | One-click demo now opens the populated, isolated Maya workspace in the first mobile viewport. |
| F-1-2 / F-2-1 / F-3-2 / F-3-3 | 28 explicit claims, one tag each; the privacy, storage, compatibility, and payment boundaries have sandbox tests. |
| F-1-3 / F-2-3 / F-3-4 | All public, offline, and 404 routes now have the common route shell, metadata, status/focus behavior, and mobile-safe navigation. |
| F-1-4 / F-3-9 | Param Factory is plain attribution, and the Privacy contact link resolves to Sociobot support. |
| F-1-5 / F-2-4 / F-3-5 through F-3-14 | Landing, prepared-state, update, Privacy, and README copy uses the consistent protected ZIP / handoff sheet / handoff log / ZIP access phrase vocabulary and concrete headings. |
| F-2-2 | The AES test observes WinZip AES strength 3, encryption, wrong/missing phrase failure, and successful decryption. |
| F-3-1 | The desktop primary action and all three facts are now inside a 1366 × 768 viewport. |

## Verification

- Clean clone: `npm ci`; every one of the 28 commands in `.factory/claims.json` passed independently.
- Current checkout: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:browser` all passed; browser result: 39/39.
- Live fresh-browser checks: 390 × 844 and 1366 × 768 cold reads, demo entry, route matrix, request logs, keyboard route focus/announcement, link crawl, metadata, 404, and console checks.

## What would make this perfect

No additional feature, copy, or structural change is indicated by this review. Continue running the existing clean-state claim suite and cold mobile/desktop checks on future releases.
