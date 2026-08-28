# Adversarial first-read review 1 — Confidential File Handoff

**Reviewed:** 2026-08-28 UTC  
**Live URL:** https://confidential-file-handoff.sociobot.in  
**Verdict: FAIL**

This was a fresh, complete review, not a diff review. The landing screen is understandable and the registered tests pass. The blocking findings below remain.

## Cold first read

Fresh Chromium contexts at 390 × 844 and 1440 × 1000 gave the same answer before scrolling:

- **What it does:** Makes a protected ZIP and gives the recipient separate opening instructions.
- **For whom:** People sending personal files to recipients who need clear opening steps.
- **First click:** **Try it with sample data** to inspect a sample, or **Create a protected ZIP** for a real file.

The exact first-screen copy is “Create a protected ZIP with opening instructions.”, “For people sending personal files to recipients who need clear, separate steps for opening them.”, and “Try it with sample data”. This passes. The demo result does not; see F-1-1.

## Findings

### F-1-1 — BLOCKING — Demo does not show the product in use after one click

**Location / quote:** /demo, “Demo — sample data, nothing is saved.” and “Sample protected ZIP is ready to review. Create it to see the ZIP, recipient instructions, and local handoff log.”

The entry action opens /demo, shows the persistent banner, loads two fictional files, uses demo:confidential-file-handoff, and Reset works. However, its first screen is another marketing hero, not the product used with realistic sample data. At 390 px, the selected-files control begins at y=2249 px and the create action at y=3484 px. At desktop they begin at y=2119 px and y=3109 px. The visitor must scroll several screens before seeing the sample.

**Fix:** Make /demo open directly on a visibly populated builder or a pre-created sample handoff kit. The first viewport must show the two sample files, Maya, the two routes, and either the prepared result or a **Create sample handoff** action. Retain the banner, Reset demo, Start for real, and isolated namespace. Add a 390 px browser assertion that a sample file name and primary result/action are in the viewport on entry.

### F-1-2 — BLOCKING — Reliance claims are unlisted

**Location / quotes:** the following live and README claims have no corresponding entry in .factory/claims.json with a unique tagged observable test:

- Builder: “The ZIP access phrase is never stored or included in the recipient sheet.”
- Records: “This browser keeps a small checklist—recipient name, dates, and delivery routes only. No file names or passwords.”
- Pro panel: “Pro is a one-time US $9 purchase that unlocks a custom note on recipient sheets. The encrypted ZIP, handoff sheet, local log, and exports stay free.”
- README: “Produces recipient opening instructions that name the downloaded ZIP and separate its delivery route from the access-phrase route.”
- README: “Lets the sender export/import that list as JSON.”
- README: “The product never embeds a payment provider.”
- README: “It does not cache responses.”
- README: “Browser verdicts last at most one day.”
- README: “The artwork is generated specifically for this product; no runtime third-party fonts, scripts, analytics, or icon libraries are used.”
- Privacy: “It does not upload selected files, ZIP access phrases, file names, or file receipts.”
- Privacy: “The demo uses separate browser storage. Reset demo clears its sample list. Start for real clears it before leaving demo mode.”
- Terms: “A valid license adds the stated Pro feature. Refunds are handled by the merchant and may end a refunded license.”

Related behaviour being covered by a broader test is insufficient: the claims contract requires each reliance claim to be explicitly listed.

**Fix:** Remove untestable promises or add a claim and unique test for each distinct promise. Add, for example, recipient-sheet-routes, local-log-import, license-cache-ttl, no-third-party-runtime, and payment-provider-boundary, testing the sheet content, import outcome, 24-hour cache boundary, request log, and checkout boundary. Split the bundled Pro copy into separately testable sentences.

### F-1-3 — HIGH — Route identity, metadata, and navigation focus are incomplete

**Location / quotes:** /demo title is “Demo — Protected ZIP instructions”; /privacy/ title and wordmark are “Privacy — Shared File Receipt” and “Shared File Receipt”; /terms/ likewise says “Terms — Shared File Receipt”; 404 says “Page not found — Shared File Receipt”.

The product is named **Confidential File Handoff** everywhere else. The demo title omits its name. Privacy, Terms, and 404 have only a title: no description, canonical, Open Graph, Twitter metadata, or favicon declaration. They use a different minimal shell. The root uses the 900 × 600 hero as its OG image, not a 1200 × 630 social preview.

Header navigation to Privacy and browser Back left focus on BODY, not the new h1; no route-change announcement exists. That disorients keyboard and screen-reader users.

**Fix:** Use “Demo — Confidential File Handoff”, “Privacy — Confidential File Handoff”, “Terms — Confidential File Handoff”, and “Page not found — Confidential File Handoff”. Give every static route the common header, skip link, footer, metadata, and favicon. Generate an original 1200 × 630 social preview. Move focus to h1 and announce the route after every route change and Back/Forward; cover this in Playwright.

### F-1-4 — HIGH — Footer link is dead

**Location / quote:** landing footer “Built by Param Factory”, linking to https://paramfactory.com.

The crawl returned 200 for /, /demo, /privacy/, /terms/, and checkout. paramfactory.com failed DNS resolution during this review (curl exit 6; HTTP 000).

**Fix:** Replace it with the current working Param Factory URL, or use non-linked text attribution. Add a crawl test for every non-mailto, non-download link.

### F-1-5 — MINOR — Copy audit flags remain

**Location / quote / fix:**

- Eyebrow “A clear process for sharing files” is a generic slogan. Delete it or use “Protected ZIP handoff”.
- h2 “Acknowledge, then forget.” does not name its section. Replace with “Review the local handoff log”.
- h2 “Useful protection, stated plainly.” is a mood heading. Replace with “What the protected ZIP does and does not protect”.
- Builder help (23 words): “File names are not saved in the receipt list, but someone can see names by listing the ZIP before entering its access phrase.” Replace with “The receipt list does not save file names. ZIP file names remain visible before the access phrase is entered.”
- Threat model (30 words): “This cannot: verify the recipient, protect a compromised phone or computer, prevent a recipient from forwarding files, scan files for malware, or guarantee the safety of any channel you choose.” Replace with “It cannot verify your recipient or secure a compromised device. It cannot stop forwarding, scan for malware, or guarantee a delivery channel.”
- README opening (23 words): “Confidential File Handoff is a local-first PWA for people who need to send personal files to someone who may need simple opening steps.” Replace with “Create a protected ZIP for people who need clear opening steps.”

## Copy audit

Word counts use human-readable words. No banned marketing adjectives were found. local-first PWA, IndexedDB, sandbox, same-origin, and browser-identity digest are jargon for first-time visitors; define them plainly or keep them in developer documentation.

### Landing sentences

| Location | Sentence | Words |
| --- | --- | ---: |
| Hero h1 | Create a protected ZIP with opening instructions. | 7 |
| Hero | For people sending personal files to recipients who need clear, separate steps for opening them. | 15 |
| Facts | No upload. | 2 |
| Facts | Works offline after first visit. | 5 |
| Facts | Free core tools; Pro is US $9 once. | 8 |
| Caption | Original generated print illustration. | 4 |
| Caption | This app does not send your files anywhere. | 8 |
| How it works | Choose files and a ZIP access phrase. | 7 |
| How it works | Send the protected ZIP and access phrase separately. | 8 |
| How it works | Record when they confirm opening it. | 6 |
| Builder | Everything happens in your browser. | 5 |
| Builder | The ZIP access phrase is never stored or included in the recipient sheet. | 13 |
| File help | They are read only to create a ZIP. | 8 |
| File help | File names are not saved in the receipt list, but someone can see names by listing the ZIP before entering its access phrase. | 23 |
| File help | Rename file names first if needed. | 6 |
| Routes | Send the protected ZIP and its access phrase by different channels. | 11 |
| Routes | This app cannot make that choice for you. | 8 |
| Pro help | Unlock Pro to add a short note to the file receipt. | 11 |
| Phrase | Use a new ZIP access phrase. | 6 |
| Phrase | Save it in your notes or write it down before you close this page. | 14 |
| Phrase | I have saved this access phrase. | 6 |
| Phrase | It will not be saved by this app. | 8 |
| Kit | Send these two things separately. | 5 |
| Kit | Send this file using your selected delivery route. | 8 |
| Kit | It requires the password to open. | 6 |
| Kit | Send or print this with the ZIP. | 7 |
| Kit | It tells your recipient where to expect the password. | 9 |
| Acknowledgement | Keep only the facts you need—never the files, password, or file names. | 13 |
| Compatibility | Recipient note: some built-in ZIP tools do not support AES-256. | 10 |
| Compatibility | The handoff sheet names compatible extractors and tells the recipient what to do if opening fails. | 16 |
| Records | This browser keeps a small checklist—recipient name, dates, and delivery routes only. | 13 |
| Records | No file names or passwords. | 5 |
| Threat model | This helps with: keeping file contents unavailable to someone who gets the ZIP but not its separate password. | 18 |
| Threat model | This does not hide file names: ZIP entry names remain readable without the password. | 14 |
| Threat model | Rename files first if their names reveal sensitive information. | 9 |
| Threat model | This cannot: verify the recipient, protect a compromised phone or computer, prevent a recipient from forwarding files, scan files for malware, or guarantee the safety of any channel you choose. | 30 |
| Threat model | For urgent or regulated needs, follow the requirements of your professional or organisation. | 13 |
| Threat model | This tool makes no medical, legal, or compliance guarantee. | 9 |
| Pro | Pro is a one-time US $9 purchase that unlocks a custom note on recipient sheets. | 15 |
| Pro | The encrypted ZIP, handoff sheet, local log, and exports stay free. | 11 |
| Footer | Built for careful, human-scale handoffs. | 5 |
| Footer | Artwork is original AI-generated product artwork. | 6 |

### README sentences

| Location | Sentence | Words |
| --- | --- | ---: |
| Opening | Confidential File Handoff is a local-first PWA for people who need to send personal files to someone who may need simple opening steps. | 23 |
| Opening | It creates a protected ZIP in the browser, writes recipient opening instructions, and keeps a small local acknowledgement list. | 19 |
| What it does | Creates the protected shared-file-receipt.zip on the sender’s device; the app does not upload selected files or the ZIP access phrase. | 21 |
| What it does | Produces recipient opening instructions that name the downloaded ZIP and separate its delivery route from the access-phrase route. | 18 |
| What it does | Keeps an IndexedDB list with only recipient name, dates, and the selected routes—not file names, file contents, or access phrases. | 21 |
| What it does | Lets the sender export/import that list as JSON. | 9 |
| What it does | Works after install and offline once the app shell has been opened. | 12 |
| Demo | Choose Try it with sample data or open /demo. | 9 |
| Demo | The demo has two fictional files, uses the demo:confidential-file-handoff IndexedDB namespace, and never reads or writes real file-receipt data. | 20 |
| Demo | Use Reset demo to clear its list; Start for real clears it before leaving demo mode. | 16 |
| Demo | See .factory/demo.md for the exact sandbox behavior. | 9 |
| Claims | Every reliance claim has a sandbox regression test in .factory/claims.json. | 12 |
| Claims | Run each listed command from a clean checkout. | 8 |
| Limits | This is a file-receipt aid, not identity verification, a transfer service, scanning tool, or professional certification. | 16 |
| Limits | Read the in-app limits before using it for an important exchange. | 11 |
| Limits | ZIP entry names are visible without the access phrase, and built-in ZIP tools can differ. | 15 |
| Limits | Rename file names before adding them if needed. | 8 |
| Limits | The generated file receipt recommends a recovery path. | 8 |
| Develop | npm run build writes the static deployable site to dist/, with dist/index.html at its root. | 17 |
| Privacy | See /privacy/ and /terms/. | 4 |
| Privacy | The free core workflow is complete. | 6 |
| Privacy | A US $9 one-time Pro license, sold by Sociobot/Dodo, adds a personal note to the recipient instructions. | 18 |
| Privacy | The product never embeds a payment provider. | 7 |
| Privacy | License checks use the same-origin /api/license/verify managed function. | 10 |
| Privacy | It forwards to Sociobot. | 4 |
| Privacy | It allows at most 20 checks per client in 60 seconds. | 11 |
| Privacy | It does not cache responses. | 5 |
| Privacy | The counter uses a one-way browser-identity digest, count, and one-minute expiry. | 11 |
| Privacy | Browser verdicts last at most one day. | 7 |
| Privacy | They apply only to the exact verified token. | 8 |
| Deploy | This remains an Azure Static Web Apps deployment. | 8 |
| Deploy | dist/ is the static root and api/ is the managed same-origin license gateway. | 13 |
| Deploy | The factory deployment command is: | 5 |
| Design | The visual system and original-art provenance are documented in .factory/design.md. | 12 |
| Design | The artwork is generated specifically for this product; no runtime third-party fonts, scripts, analytics, or icon libraries are used. | 19 |

Primary controls use result-naming verbs: **Try it with sample data**, **Create a protected ZIP**, **Create protected ZIP and recipient sheet**, **Download encrypted ZIP**, **Download handoff sheet**, **Export handoff log**, and **Reset demo**. “Restore purchase” should be “Restore Pro license”. Terminology is inconsistent: product name is **Confidential File Handoff**, while legal/404 pages say **Shared File Receipt**; output is called a **recipient handoff sheet**, **recipient instructions**, and **file receipt**. Use one term for each concept.

## Claims, sandbox, and quality gates

All eight exact commands from .factory/claims.json passed: demo-sandbox, encrypted-local-zip, offline-after-first-visit, local-log-export, checklist-secrets-excluded, pro-note-entitlement, demo-exit-discard, and license-rate-limit.

The live demo request log contained only the product origin and its same-origin blob download URL while loading, creating the sample ZIP, downloading it, and resetting. A fresh demo context had no real-license localStorage key and only demo:confidential-file-handoff IndexedDB storage. The source claim test passes offline reload and packet creation.

npm test, npm run lint, npm run typecheck, npm run build, and the full 18-test browser suite passed. The production JS is 70.46 KB gzip. Cold live loads produced no console/page errors. Axe A/AA smoke checks at 390 px found no violations on /, /demo, /privacy/, /terms/, or 404.

## History, structure, and missed leverage

No earlier .factory/review-*.md or .factory/polish-*.md exists. I read the existing handoff. Its two stated follow-ups—normalising static route metadata and creating a 1200 × 630 OG image—remain unfixed; F-1-3 reconfirms them.

robots.txt, sitemap.xml, CSP response headers, the app favicon, designed 404 status, legal routes, local-only free flow, and the distinctive dithered-print identity pass. No AI feature is missing: this local/offline encryption job would not benefit from transmitting sensitive content to an AI service, and import/export already exists.

## What would make this perfect

Make the demo tangible in its first mobile viewport, register and test every reliance claim, complete the route shell and metadata, repair the dead footer link, and reduce the remaining jargon/slogan/overlong copy. Re-run this entire review from a clean browser context and return PASS only with zero findings.
