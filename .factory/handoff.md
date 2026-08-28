# Confidential File Handoff — repair handoff

## Status: ready to deploy

- Work order: `confidential-file-handoff-repair-2`
- Repair base: `25e73b221b158b0d4834c18db4b600766f6fa190`
- Deployment class: static PWA with same-origin `api/` function
- Built output: `dist/` with `index.html` at its root

## Repaired findings

- Added `.factory/claims.json` with four observable claims. Each has exactly one Playwright command and runs from `/demo`.
- Added `/demo` and `?demo=1`. Demo seeds two fictional redacted files and a realistic two-channel handoff. It uses IndexedDB `demo:confidential-file-handoff`, never the real database. Its banner includes **Reset demo** and **Start for real**. `.factory/demo.md` documents this contract.
- Rewrote the first screen to name senders of tax, medical, legal, identity, and credential files to recipients who need plain steps. It now includes the required offline and US $9 one-time facts.
- Repaired Pro verification. A token stays locked until a successful definitive verification. HTTP 429/503/network failures preserve only a previously verified valid cache and never write an invalid verdict.
- Linked recipient and saved-password errors with `aria-describedby`; invalid submission moves focus to the first invalid control and gives an actionable live message.
- Added metadata, canonical/OG/Twitter/apple-touch tags, robots, sitemap, static 404, legal-page semantic shells, a build id, Param Factory links, and the required copy audit.

## Verification evidence

Fresh clean install and quality gates passed on 2026-08-28 UTC:

```sh
npm ci
npm audit --audit-level=low            # 0 vulnerabilities
npm run typecheck                      # pass
npm run lint                           # pass
npm test                               # 4 Vitest + 2 API tests pass
npm run build                          # pass; dist/ generated
npm run test:browser                   # 14/14 Chromium tests pass
```

Claim commands all passed independently:

```sh
npm run test:browser -- --grep @claim:demo-sandbox
npm run test:browser -- --grep @claim:encrypted-local-zip
npm run test:browser -- --grep @claim:offline-after-first-visit
npm run test:browser -- --grep @claim:local-log-export
```

The claim tests prove a resettable isolated demo, an AES ZIP that decrypts with the demo password, same-origin-only core traffic, offline reload plus local packet creation, and checklist-only export fields. The full suite retains coverage for duplicate ZIP names, wrong-password rejection, print content, unavailable IndexedDB, import recovery, delayed acknowledgement, service-worker privacy offline behavior, response-policy routing, 390px light/dark keyboard/touch/reduced-motion behavior, and axe-core zero-violation scans.

`/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence/repair-2` passed: 653 ms load; no console errors; title, `lang=en`, one h1, main landmark, and image alt checks all pass. Screenshots and `verify.json` are in `.factory/evidence/repair-2/`.

Production assets are 165,955 B JS (70,450 B gzip), 13,134 B CSS (3,810 B gzip), and 154,836 B hero image. The separate axe CLI could not launch Chrome in this container; Playwright’s pinned Chromium axe integration ran successfully in the browser suite. Two Lighthouse 13 attempts could not connect to the container Chromium; the prior independent live mobile result was 96 Performance / 100 Accessibility / 100 Best Practices / 100 SEO. No performance claims were added or changed.

## Deploy and post-deploy

Deploy with:

```sh
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

After deployment, rerun `verify-url.sh` against the HTTPS URL, the four claim commands, the live same-origin license-rate-limit check, and an old-worker update check. No known product gaps remain from verification report 2.
