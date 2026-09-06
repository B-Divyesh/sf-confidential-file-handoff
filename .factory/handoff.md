# Repair 6 handoff — Confidential File Handoff

## Outcome

**PASS.** The prepared result keeps **Download handoff sheet** as its visible and accessible action after Maya's sample is created. The nearby sentence now reads “It tells Maya where to expect the access phrase.” without mutating sibling text nodes. The download still produces `confidential-file-handoff.txt` with the ZIP name, both routes, and compatibility guidance.

The live phone audit also exposed a dark-theme result panel whose foreground inherited the dark page token. The panel now uses its fixed warm-paper foreground in both themes. A prepared-state axe regression covers this state.

Implementation SHA: `7a64d762732df3d0523bbaac5f2325c29609789c` (label repair: `ab403c91bfd8aaae226423e5a173edcc2b451b32`). Documentation/evidence SHA: `6e7c2038d80ed249d59eff63968fe32166be8396`. Deployment ID: `16c9a50d-e3ac-46f8-b801-646b64f74fb8`.

## Verification

- Clean detached checkout at the implementation SHA: `npm ci`, followed by every exact command in `.factory/claims.json`; **28/28 passed** independently.
- Clean gates: `npm test` (4 Vitest + 10 gateway tests), `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:browser` (**41/41**) passed. `dist/index.html` exists.
- Bundles: 171,688 B JavaScript (71.28 kB gzip) and 15,180 B CSS (4.26 kB gzip).
- The deployed root, JavaScript, CSS, and service worker byte-match the implementation build. Root, Demo, Privacy, Terms, Offline, manifest, robots, and sitemap return 200; the designed missing route returns the expected 404.
- Fresh 1366 × 768 desktop and 390 × 844 phone contexts show the job, audience, first action, and all three facts before scrolling. The sample has Maya, two realistic files, both routes, and the persistent demo label.
- In the live prepared result, the button name is **Download handoff sheet** on desktop and dark/reduced-motion phone. The download filename and contents pass. Demo reset removes its record and preserves a seeded real record.
- Empty submission focuses the file picker with a corrective status. The 80-character recipient, duplicate names, empty file, 12-character phrase, download, persisted sent state, and reload recovery pass.
- Live offline reload remains service-worker controlled and creates the sample handoff. The core live flow makes no off-origin requests and reports no console errors.
- Live axe on the populated dark/reduced-motion phone state has zero serious or critical findings. `verify-url.sh` passes root and demo.
- Live Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.26 s, LCP 2.01 s, CLS 0, TBT 0 ms.
- From one fresh browser identity, live license checks 1–20 returned 200; request 21 returned 429 with `Retry-After: 54`.

Evidence is under `.factory/evidence/repair-6-local/` and `.factory/evidence/repair-6-live/`.

## Earlier findings and remaining gaps

All findings from reviews 1–5 and verifications 1–7 were rechecked through the clean claims and browser suites. Their demo, claims, encryption, recipient guidance, log recovery, privacy, paid-boundary, route, copy, accessibility, PWA, and rate-limit regressions remain green. The current F-5-1 label defect is closed, and the dark-theme issue found during this repair is also closed.

No product defect is known. A real production purchase was not charged during verification, so no new paid token was issued; recorded valid/revoked entitlement responses cover that path without inventing credentials.
