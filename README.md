# Confidential File Handoff

Confidential File Handoff is a local-first PWA for people sending sensitive tax, medical, legal, or credential files to someone who should not need technical help. It creates a standard AES-encrypted ZIP in the browser, writes a plain-language recipient handoff sheet, and keeps a small local acknowledgement checklist.

Live: https://confidential-file-handoff.sociobot.in

## What it does

- Creates an AES-256-protected `confidential-handoff.zip` on the sender’s device; the app does not upload selected files or the ZIP password.
- Produces a recipient sheet that explicitly separates the ZIP delivery route from the password route.
- Keeps an IndexedDB checklist with only recipient name, dates, and the selected routes—not file names, file contents, or passwords.
- Lets the sender export/import that checklist as JSON.
- Works after install and offline once the app shell has been opened.

## Try the demo

Choose **Try it with sample data** or open [/demo](/demo). The demo has two fictional redacted files, uses the `demo:confidential-file-handoff` IndexedDB namespace, and never reads or writes real handoff data. Use **Reset demo** to clear its checklist; **Start for real** clears it before leaving demo mode. See [.factory/demo.md](.factory/demo.md) for the exact sandbox behavior.

Every reliance claim has a sandbox regression test in [.factory/claims.json](.factory/claims.json). Run each listed command from a clean checkout.

This is a handoff aid, not identity verification, a secure transfer service, malware scanning, or medical/legal/compliance certification. Read the in-app threat model before using it for an important exchange.

ZIP entry names are visible without the password, and some built-in ZIP tools do not support AES-256. Rename sensitive filenames before adding them. The generated recipient sheet recommends compatible extractors and a recovery path.

## Develop and verify

Requires Node 20+.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

`npm run build` writes the static deployable site to `dist/`, with `dist/index.html` at its root.

## Privacy and paid unlock

See [/privacy/](/privacy/) and [/terms/](/terms/). The free core workflow is complete. A US $9 one-time Pro license, sold by Sociobot/Dodo, adds a personal note to the recipient sheet. The product never embeds a payment provider. License checks use the same-origin `/api/license/verify` managed function. It forwards to Sociobot. It allows at most 20 checks per client in 60 seconds. It does not cache responses. The shared counter keeps a one-way browser-identity digest, count, and one-minute expiry. Browser verdicts last at most one day. They apply only to the exact verified token.

## Deploy

This remains an Azure Static Web Apps deployment. `dist/` is the static root and `api/` is the managed same-origin license gateway. The factory deployment command is:

```sh
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

## Design and source artwork

The visual system and original-art provenance are documented in [.factory/design.md](.factory/design.md). The artwork is generated specifically for this product; no runtime third-party fonts, scripts, analytics, or icon libraries are used.
