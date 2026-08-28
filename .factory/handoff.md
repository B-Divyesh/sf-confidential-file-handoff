# Confidential File Handoff — independent verification handoff

## Status: FAIL

- Work order: `confidential-file-handoff-verify-2`
- Candidate: `3bcec003d620a6ad484809c882362aa4195a8554`
- Live URL: <https://confidential-file-handoff.sociobot.in/>
- Verified: 2026-08-28 UTC
- Full report: `.factory/verification-2.md`

The live product matches the candidate and the free handoff workflow works. It is not release-ready because the required claims registry is missing, there is no one-click isolated sample-data demo, the first screen does not plainly name the intended user, and paid entitlement can be bypassed or incorrectly revoked during verification failures.

No product code was modified by this verification.

## Release-blocking findings

1. `.factory/claims.json` is absent. This was checked before installation or any other product test. There were therefore no required claim commands to run, and the contract defines the missing file as release-blocking.
2. The first screen has no `Try it with sample data` action. `/demo` and `?demo=1` both return the ordinary real-data app with no sample data, banner, reset, start-for-real action, or isolated namespace. `.factory/demo.md` is absent.
3. The first screen explains the encrypted ZIP and real first action, but does not plainly name people sending high-stakes files to non-technical recipients. It also omits the required offline and price facts.

## High-severity defects

1. Pasting any token enables the Pro note when `/api/license/verify` is unreachable. A downloaded recipient sheet included the paid note with no cached or valid verdict.
2. A 429/503 verification response is parsed as `valid:false`, disables Pro, and is cached for 24 hours. A valid buyer can lose access because the gateway is busy or unavailable.

## Other defects

- **Medium:** Recipient and saved-password errors lack `aria-describedby`; invalid-submit focus stays on Submit and the live region announces only a generic message.
- **Medium:** No real 404, robots, sitemap, canonical, OG/Twitter tags, apple-touch tag, or consistent header/footer on legal pages.
- **Medium:** `.factory/copy-audit.md` is missing and live/legal copy includes sentences over 22 words.
- **Low:** Root title is 61 characters; footer lacks the required Param Factory link and build id.

## Passing fresh evidence

- `npm ci`, low-level audit, unit/API tests, ESLint, TypeScript, production build, and all 8 Playwright regressions passed.
- A live duplicate-name/zero-byte packet produced an AES-256 encrypted ZIP; correct extraction passed and a wrong password failed. The sheet omitted the password and selected file names.
- Whitespace/11-character invalid input was rejected and recovered; 80-character recipient, 12-character password, duplicate names, zero bytes, and 5 MiB passed.
- Printing, strict import recovery, minimal IndexedDB fields, export, and delayed sent/opened acknowledgement passed.
- Core traffic stayed same-origin with no analytics, third-party scripts/fonts, console errors, or page errors.
- 390px light/dark axe had zero violations; visible focus, reduced motion, touch wrappers, and base reflow passed.
- PWA manifest, controlled offline reload/creation, offline Privacy, and an old-worker-to-candidate update passed.
- Live rate limit: requests 1–20 returned 200; request 21 first returned 429 with `Retry-After: 58` and limit 20.
- Checkout returned 303 to hosted Dodo. A real purchase was not charged.
- Live/candidate files matched byte-for-byte. Lighthouse mobile: 96/100/100/100; LCP 2.1s, TBT 200ms, CLS 0; 224 KiB transfer.

## Verification commands

```sh
npm ci
npm audit --audit-level=low
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

Evidence is in `.factory/evidence/`; exact hashes, browser results, response policies, defects, and reproduction details are in `.factory/verification-2.md`.
