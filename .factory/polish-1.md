# Polish round 1 — cumulative finding closure

## F-1-1 — demo did not show the product in use after one click

- Change: the first-screen action now opens `/?demo=1`. The demo first viewport shows `project-update.txt`, `meeting-notes.txt`, Maya, both routes, and **Create sample handoff**. The persistent banner retains **Reset demo** and **Start for real**. The editable builder remains available through **Change sample details**.
- Isolation: demo records use `demo:confidential-file-handoff`; real records use `confidential-file-handoff`. Reset and exit clear only demo activity.
- Evidence: `@claim:demo-sandbox`, `@claim:demo-reset`, and `@claim:demo-exit-discard`; 390×844 screenshot `.factory/evidence/polish-1-local-demo-mobile.png`; create action measured at y=677 in the 844 px viewport.
- Live check: pending deployment in this commit.

## F-1-2 — reliance claims were unlisted

- Change: `.factory/claims.json` now lists 22 distinct reliance claims. Each ID appears in exactly one observable browser or gateway test. Bundled promises were split into separate storage, sheet, import, privacy, price, payment, entitlement, cache, gateway, runtime, and provenance checks.
- Evidence: all 22 listed commands pass independently; the full browser suite passes 32/32; gateway tests pass 9/9. The tag-count audit reports exactly one `@claim:<id>` occurrence per claim.
- Live check: pending deployment in this commit.

## F-1-3 — route identity, metadata, and focus were incomplete

- Change: Demo, Privacy, Terms, offline, and 404 now use **Confidential File Handoff**. Every public route has a route-specific title, description, canonical URL, Open Graph and Twitter metadata, favicon, shared header/footer, skip link, and one h1. `public/social-preview.png` is an original 1200×630 derivative. Internal navigation and Back/Forward focus and announce the new h1. Static Web Apps rewrites missing routes to the styled 404 with status 404.
- Evidence: `routes have exact titles, complete metadata, a shared shell, and a real 404`; `internal navigation and browser Back move focus to and announce the route heading`; local verify reports zero console errors and one h1 on root and demo; route axe checks pass.
- Live check: pending deployment in this commit.

## F-1-4 — dead Param Factory footer link

- Change: removed the dead external link and retained **Built by Param Factory** as text. A crawler now requests every remaining non-download link, including hosted checkout.
- Evidence: `every non-download link resolves`; `@claim:payment-provider-boundary` follows the checkout to a 200 Dodo-hosted page.
- Live check: pending deployment in this commit.

## F-1-5 — copy audit flags and terminology

- Change: replaced the generic eyebrow and both mood headings, split the overlong file-name and threat-model copy, rewrote the README opening, and renamed **Restore purchase** to **Restore Pro license**. User-facing output is now consistently **handoff sheet**; local history is **handoff log**; the secret is **ZIP access phrase**.
- Evidence: `.factory/copy-audit.md` contains every rendered landing and demo sentence with no sentence over 22 words and no banned marketing word. Root first-screen screenshot: `.factory/evidence/polish-1-local-root-mobile.png`.
- Live check: pending deployment in this commit.

## Quality evidence before deployment

- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`: pass.
- `npm run test:browser`: 32/32 pass.
- `verify-url.sh` on root and `/?demo=1`: titles, lang, one h1, main, image alts, button labels, and console checks pass.
- Playwright axe integration: no violations in both mobile themes; no serious or critical findings on Privacy, Terms, or 404.
- Lighthouse mobile: performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.4 s, CLS 0, TBT 0 ms.
- Bundles: initial JS 71.34 KB gzip; CSS 4.20 KB gzip.
