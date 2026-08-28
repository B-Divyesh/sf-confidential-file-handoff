# Confidential File Handoff — independent verification handoff

## Status: FAIL

Candidate `18b5f7f00430940296c30acb8203230c0f60f2ab` was independently verified on 2026-08-28 against <https://confidential-file-handoff.sociobot.in/>. The deployment is live and its HTML, JS, CSS, and service-worker hashes match the candidate. It is not release-ready.

Full evidence and reproductions are in [`.factory/verification.md`](verification.md).

## Blocking findings

- The persisted acknowledgement checklist cannot be updated after reload/tab return; pending records become read-only except for deletion.
- The advertised Pro checkout returns HTTP 404.
- A 120-request concurrent license-verification burst returned 120 HTTP 200 responses: no 429 and no `Retry-After` (observed threshold greater than 120 or absent).
- PWA updates are stale: the unchanged `confidential-handoff-v1` worker/cache and stable `assets/app.js` kept serving parent JS after an online candidate update/reload.
- The update toast is visible on every load and axe reports its dark-theme Refresh button at 1.57:1 contrast (serious).
- IndexedDB failure blocks delivery of an already-created ZIP despite the UI saying handoff creation still works.
- Import accepts/stores arbitrary extra fields such as `password`/`fileName`, and an invalid date permanently breaks the log view.
- Print opens a blank tab; duplicate filenames abort multi-file creation.

Medium/low findings also cover ZIP client interoperability and plaintext filename disclosure, clipped file-picker focus, sub-44px mobile controls, missing CSP/framing/Permissions-Policy headers, offline policy-route behavior, short asset caching, missing exact Pro price, and absent `.factory/brief.json`.

## Passing evidence

- Clean `npm ci`, `npm test` (3/3), TypeScript check, exact Vite production build, and npm audit passed.
- Live/candidate SHA-256 hashes match for `index.html`, `assets/app.js`, `assets/style.css`, and `sw.js`.
- Desktop and 390px mobile happy paths created and downloaded AES-encrypted ZIPs and correct recipient sheets without console/page errors or file/password upload.
- Offline root reload and offline ZIP creation passed; Chromium reported no manifest/installability errors.
- Lighthouse mobile: Performance 93, Accessibility 100 (light), Best Practices 100, SEO 100; LCP 2.1s, CLS 0. Payload budgets pass.
- Light-theme axe, privacy, and terms scans had zero violations; reduced-motion behavior passed.

## Verification commands

```sh
npm ci
npm test
npm run build
npm exec vite -- preview --host 127.0.0.1 --port 4173
```

No product code was modified. Native Windows/macOS ZIP interoperability, a successful paid purchase, and field INP remain unverified; checkout being unavailable prevents the paid-path test.
