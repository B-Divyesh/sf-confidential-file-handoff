# Confidential File Handoff — builder handoff

## Delivered

- A Vite + TypeScript static PWA in `dist/` with manifest, 192/512 maskable icons, a versioned hand-written service worker, offline fallback, update notification, and `start_url` version query.
- A complete local handoff wizard: multi-file selection, 18-character secure password generator, sender acknowledgement, AES-encrypted ZIP creation via `@zip.js/zip.js`, downloadable ZIP, downloadable/printable plain-language recipient sheet, and manual sent/opened checklist.
- A local IndexedDB handoff log that intentionally excludes files, file names, and passwords; it has JSON export/import and specific confirmed deletion.
- Plain-language threat model and error/offline states. The app does not claim E2EE, hosting, identity verification, or compliance certification.
- One-time Pro route using the required Sociobot checkout and license verification contract. Free encryption, handoff sheet, safety guidance, and data export remain ungated; Pro adds a local custom note to the recipient sheet.
- `/privacy/` and `/terms/`, MIT license, refreshed README, and a documented dithered/halftone visual system in `.factory/design.md`.

## Verification performed

Run from a clean install:

```sh
npm install
npm test
npm run build
```

Results on 2026-08-28:

- `npm test`: 3 unit tests passed.
- `npm run build`: passed; generated `dist/index.html` and static deploy assets. Main JS is 160.25 KB uncompressed / 68.49 KB gzip, CSS is 11.50 KB uncompressed / 3.51 KB gzip, and the hero WebP is 152 KB—within the static budgets.
- Playwright Chromium at 390×844: selected a test file, completed the form by keyboard-operable controls, created the encrypted ZIP, downloaded `confidential-handoff.zip`, and observed no console errors. `zipinfo -v` reports the output entry as encrypted with ZIP compression method 99 (WinZip AES).
- Offline: after the initial visit and reload, `context.setOffline(true)` still loaded the application shell with its title, main landmark, and one H1.
- axe-core browser run: 0 violations (41 passing checks).
- Lighthouse mobile run against the built static server: performance 94, accessibility 100, CLS 0. The local container’s Chromium target crashed during Lighthouse’s final screenshot collection, but the generated JSON report and category scores were written successfully. Measured LCP was 2.96 s on that constrained local run; the hero has since been reduced to 152 KB (the score result was from the earlier 194 KB variant), so production should be rechecked on deployed hosting.

## Known gaps / next steps

- The ZIP creator is exercised end-to-end in Chromium, but an external recipient-device interoperability pass (Windows Explorer, macOS Archive Utility, Android) is the sensible final product QA before a public announcement.
- The service worker intentionally uses a small fixed app-shell list because Vite output file names are configured stable for offline precache. Bump `VERSION` in `public/sw.js` with a release that changes the shell.
- The current flat static server cannot set immutable cache headers; deployment should configure long-lived caching for `/assets/*` and the image/icons, while serving `sw.js` with revalidation.
