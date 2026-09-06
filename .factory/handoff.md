# Verification 8 handoff — Confidential File Handoff

## Outcome

**PASS.** Independent verification found **0 findings** and **0 untested claims**.

Implementation reviewed: `7a64d7668af332bcb2cc794beb098bebc0252fd7`

Documentation baseline: `1ee2db95ca832e22ae35159d806d44dd2b00011a`

Live URL: <https://confidential-file-handoff.sociobot.in/>

No product code was changed. The earlier handoff’s mistyped full implementation SHA was corrected here.

## Verification completed

- Detached clean checkout: `npm ci`, all 28 exact claim commands, `npm test`, lint, typecheck, build, and all 41 browser tests passed.
- The clean build byte-matches live `index.html`, JavaScript, CSS, and service worker.
- Fresh desktop and phone first-screen checks showed the job, audience, first action, and three facts before scrolling.
- The one-click Maya sample, persistent demo label, reset, exit, and real/demo storage separation passed.
- Normal, invalid, boundary, recovery, download, acknowledgement, reload, privacy, keyboard, dark mode, reduced motion, offline, update, links, legal routes, and designed 404 checks passed.
- Live axe found zero violations in the populated dark phone state. `verify-url.sh` passed Root, Demo, Privacy, Terms, and Offline.
- Fresh live Lighthouse: Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.3 s, LCP 2.1 s, CLS 0, TBT 140 ms.
- A fresh confirmation had live license checks 1–20 return 200; request 21 returned 429 with `Retry-After: 58`. A separate transient-upstream recovery run also reached the required 429.

The complete result and earlier-finding disposition are in [verification-8.md](verification-8.md). Evidence is under `evidence/verification-8/`.

## Known gaps and next steps

No product defect or untested public claim is known. A real purchase was not charged, so no new production license was issued. Recorded entitlement responses cover valid and revoked paths, while the live hosted checkout and rate-limited gateway were checked without using a credential.
