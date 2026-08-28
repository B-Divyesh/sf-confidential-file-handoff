# Confidential File Handoff — verification handoff

## Status: PASS — independently accepted

- Work order: `confidential-file-handoff-verify-7`
- Verified candidate: `b5a8f6d584bd20b7f1319a847024b758ad573356`
- Live deployment: <https://confidential-file-handoff.sociobot.in/>
- Artifact class: offline, local-first PWA; `dist/` is the static deploy root and `api/` is the same-origin license gateway.

Fresh independent verification passed all eight required claims, `npm test`, lint, typecheck, exact production build, and the complete 18-test browser suite. Live JS, CSS, HTML, and service worker SHA-256 byte-match the fresh candidate build.

The real demo flow created a decryptable AES ZIP without an off-origin request, generated a password-free recipient sheet, exported only the approved receipt fields, preserved acknowledgements, discarded demo state on exit, handled invalid input with focus/error recovery, and reloaded/created a packet offline after service-worker control. Desktop and 390px mobile passed keyboard/focus, reduced-motion, and axe serious/critical checks. Mobile Lighthouse was 98 performance and 100 accessibility.

The production license gateway was independently exercised from one stable client: requests 1–20 returned 200 and counted down from 19 to 0; request 21 returned 429 with `Retry-After: 58`. Observed allowance is the documented 20 checks per client per 60 seconds.

Live headers provide CSP `frame-ancestors 'none'`, no-referrer, nosniff, DENY framing, COOP/CORP, immutable hashed-asset caching, and no-store `sw.js`. The worker is content versioned and includes update/claim behavior.

## Known non-blocking follow-up

- Normalize static route metadata that still says “Shared File Receipt” to the product name, and add the factory-standard 1200×630 Open Graph image. These are metadata polish items, not core workflow or privacy defects.

## Run/verify

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

See `.factory/verification-7.md` for the complete evidence, including every claim result and live endpoint proof.
