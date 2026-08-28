# Independent product verification 4 — FAIL

**Candidate:** `00eaf393928e853f4f7e16becbd9b4b40b421756`  
**Live URL:** <https://confidential-file-handoff.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Work order:** `confidential-file-handoff-verify-4`

## Verdict

**FAIL — do not release.** The static PWA itself is healthy, deployed static artifacts exactly match the candidate, and all declared claim tests pass. The candidate nevertheless fails mandatory product-contract gates:

1. **High / release-blocking — live API allowance is not enforced.** From one client, sequential invalid-license requests 1 through 21 all returned `200`. The documented allowance is 20 per 60 seconds, so request 21 had to return `429` with `Retry-After`; it did neither. The source unit test passes, but the live server-side behavior does not meet the contract.
2. **High / release-blocking — an unverified token unlocks paid output while verification is pending.** With a stored token and the same-origin verification response deliberately delayed, the live page said “Checking your license…” while `#custom-note` was enabled. A packet created in that interval included the typed paid note in the downloaded recipient sheet, before the delayed response rejected the token.
3. **High / release-blocking — reliance claims are not fully registered and sandbox-tested.** The four registered claims pass, but the live page/README also promise password non-storage/sheet exclusion, narrow IndexedDB storage, AES-256, Pro-note entitlement, and the 20-check/minute allowance. Those promises have no corresponding `claims.json` entry and exact tagged observable test. The claims contract makes this a failure.
4. **Medium — leaving the demo does not discard demo data.** After creating a demo record, following **Start for real**, and returning to `/demo`, the record remained in `demo:confidential-file-handoff`. That contradicts the demo banner’s “nothing is saved” wording and the required exit behavior.

No product code was changed during this verification.

## Mandatory first gates

### Claims: PASS

From a clean detached checkout at the exact candidate, `npm ci` installed 161 packages with 0 audit vulnerabilities. Each published command was then run separately against the shipped `/demo` entry point:

```text
npm run test:browser -- --grep @claim:demo-sandbox
1 passed

npm run test:browser -- --grep @claim:encrypted-local-zip
1 passed

npm run test:browser -- --grep @claim:offline-after-first-visit
1 passed

npm run test:browser -- --grep @claim:local-log-export
1 passed
```

`.factory/claims.json` exists and declares exactly these four IDs. They demonstrate the isolated sample, an encrypt/decryptable ZIP with only same-origin test traffic, offline reload plus packet creation, and checklist-only exported fields.

### Cold first-read: PASS

In a fresh 1440×900 live browser context, before interaction, the screen said:

- **What it does:** “Send sensitive files with clear instructions.”
- **For whom:** people sending tax, medical, legal, identity, or credential files to recipients who may need plain steps.
- **What to click first:** **Try it with sample data**.

It also states no upload, offline-after-first-visit, free core tools, and the US $9 one-time Pro price. The 390 px view retained the visible primary action. This clears the plain-words and one-click demo gate.

## Local quality gates: PASS

```text
npm test             PASS — 4 Vitest tests and 2 API tests
npm run lint         PASS
npm run typecheck    PASS
npm run build        PASS — dist/ produced
npm run test:browser PASS — 14/14 Chromium tests
```

Production output was 165,955 B JS (70.45 kB gzip), 13,134 B CSS (3.81 kB gzip), and a 154,836 B hero image. This is within the supplied static/PWA budgets.

## Live deployment identity and headers: PASS

The deployed static product is the candidate, not a stale or different build. SHA-256 comparisons matched for all published static artifacts: root, `/demo`, `/privacy/`, `/terms/`, `404`, worker, manifest, JS, CSS, hero image, icons, offline page, robots, and sitemap. Examples:

```text
index.html                    8c6de7b2ff0eb9a74603cc1552b3d63973514dcc450e99d2bf5844246edcb8b5
assets/main--qTiq1UH.js       4e231b6fcdb6c9f666d07023bb884475088fd490a39df53b8fd5c51d9f482bba
assets/main-KrLWLdpv.css      1134bfe8295be8c5f77a05c133200d7c6005bbb462a699ddb176abdea8f15f41
sw.js                         2931f4397d949cab8e94e83e84b01928f8fb2ebf634ee9335173b3c6d9dbccf7
```

`verify-url.sh` passed against the HTTPS URL: 200 response, no console/page errors, `lang=en`, one H1, main landmark, image alt coverage, and named buttons. Live headers include HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, a restrictive CSP, Permissions-Policy, `X-Frame-Options: DENY`, COOP, and CORP. Hashed JS/CSS are immutable for one year; `sw.js` is no-store; the manifest has `application/manifest+json`.

## End-to-end, privacy, PWA, accessibility: PASS

- A live `/demo` session loaded the two fictional files, created the encrypted packet, downloaded `confidential-handoff.zip`, and recorded Maya’s email/text handoff checklist. Empty submission announced actionable errors and focused the recipient after a file had been supplied; the correctable path worked.
- During the core live flow, the request log contained only product-origin documents/assets and product-origin `blob:` downloads—no uploads, analytics, third-party scripts, fonts, or calls to the license service.
- After service-worker control, a 390 px reduced-motion live `/demo` reload worked offline and created a packet. A separate local update simulation using the actual candidate worker detected a newer worker and displayed “A newer version is ready. Refresh.”
- Keyboard Tab order started with the visible skip link and reached the header, sample action, file input, fields, selects, password generator, and checkbox; Enter on the sample action entered `/demo`. Visible focus was solid throughout.
- Axe-core 4.10.3 found zero violations on root (light), `/demo` (dark), Privacy, and Terms at 390×844. No horizontal overflow occurred. `prefers-reduced-motion: reduce` computed `scroll-behavior: auto`.

## Server-side allowance: FAIL

The candidate source and local API unit test specify `MAX_REQUESTS = 20` in a 60-second window. Fresh live evidence did not match:

```text
one client, invalid license token
requests 1–20: 200, X-RateLimit-Limit: 20
request 21:    200, no Retry-After
```

All responses were JSON with `Cache-Control: no-store`, but the required rejection never occurred. Whether this is due to non-shared in-memory state across function instances or a deployment mismatch in the managed function, the observable live behavior fails the stated allowance and is release-blocking.

## Reproduced functional defects

### Paid unlock race — high

With `sb_license:confidential-file-handoff=never-verified-qa-token` set before first load and `/api/license/verify` held for five seconds, the live state was:

```text
license status: Checking your license…
custom note enabled: true
downloaded recipient sheet contains supplied paid note: true
```

The delayed API then answered `{ valid: false }`. A first-use token must remain locked unless there is a previously verified valid verdict.

### Demo exit retention — medium

The demo created its sample row in the correct `demo:` namespace, not real storage. But this exact sequence left it behind:

```text
/demo → Create packet → Start for real → /demo
```

The returning demo log still showed Maya’s prepared entry. Exit must clear demo storage or explicitly offer a keep/discard decision.

## Defects by severity

### High / release-blocking

1. Live license verification never rate-limits a single client past 20 requests/minute; request 21 was 200 rather than 429 + Retry-After.
2. First-use/unverified license tokens enable the paid note before verification and can generate paid sheet content.
3. Material public/README promises are absent from `.factory/claims.json` and exact demo-sandbox tests.

### Medium

1. Demo records survive leaving demo mode, contrary to the banner and demo-sandbox contract.

## Recommended release criteria

Use a rate-limit store shared by all deployed function instances, prove the 21st single-client request is `429` with a nonzero `Retry-After` on the live URL, and add a regression that exercises that deployed boundary. Initialize Pro as locked unless a cached valid verdict exists. Clear demo storage on **Start for real** (or present an explicit keep/discard choice). Register every reliance claim with one matching tagged sandbox test, including stored data shape, password/sheet exclusion, AES strength, entitlement, and rate allowance. Re-run this verification after deployment.
