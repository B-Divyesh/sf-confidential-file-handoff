# Confidential File Handoff

Confidential File Handoff is a local-first PWA for people who need to send personal files to someone who may need simple opening steps. It creates a protected ZIP in the browser, writes recipient opening instructions, and keeps a small local acknowledgement list.

Live: https://confidential-file-handoff.sociobot.in

## What it does

- Creates the protected `shared-file-receipt.zip` on the sender’s device; the app does not upload selected files or the ZIP access phrase.
- Produces recipient opening instructions that name the downloaded ZIP and separate its delivery route from the access-phrase route.
- Keeps an IndexedDB list with only recipient name, dates, and the selected routes—not file names, file contents, or access phrases.
- Lets the sender export/import that list as JSON.
- Works after install and offline once the app shell has been opened.

## Try the demo

Choose **Try it with sample data** or open [/demo](/demo). The demo has two fictional files, uses the `demo:confidential-file-handoff` IndexedDB namespace, and never reads or writes real file-receipt data. Use **Reset demo** to clear its list; **Start for real** clears it before leaving demo mode. See [.factory/demo.md](.factory/demo.md) for the exact sandbox behavior.

Every reliance claim has a sandbox regression test in [.factory/claims.json](.factory/claims.json). Run each listed command from a clean checkout.

This is a file-receipt aid, not identity verification, a transfer service, scanning tool, or professional certification. Read the in-app limits before using it for an important exchange.

ZIP entry names are visible without the access phrase, and built-in ZIP tools can differ. Rename file names before adding them if needed. The generated file receipt recommends a recovery path.

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

See [/privacy/](/privacy/) and [/terms/](/terms/). The free core workflow is complete. A US $9 one-time Pro license, sold by Sociobot/Dodo, adds a personal note to the recipient instructions. The product never embeds a payment provider. License checks use the same-origin `/api/license/verify` managed function. It forwards to Sociobot. It allows at most 20 checks per client in 60 seconds. It does not cache responses. The counter uses a one-way browser-identity digest, count, and one-minute expiry. Browser verdicts last at most one day. They apply only to the exact verified token.

## Deploy

This remains an Azure Static Web Apps deployment. `dist/` is the static root and `api/` is the managed same-origin license gateway. The factory deployment command is:

```sh
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

## Design and source artwork

The visual system and original-art provenance are documented in [.factory/design.md](.factory/design.md). The artwork is generated specifically for this product; no runtime third-party fonts, scripts, analytics, or icon libraries are used.
