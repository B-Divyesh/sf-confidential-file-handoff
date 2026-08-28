# Confidential File Handoff

Create a protected ZIP for people who need clear opening steps. The browser also creates a handoff sheet and keeps a small local handoff log.

Live: https://confidential-file-handoff.sociobot.in

## What it does

- Creates the AES-256 protected `confidential-file-handoff.zip` in the browser.
- Creates a handoff sheet that names the ZIP and explains both delivery routes.
- Stores only the recipient, dates, and selected routes in a browser database.
- Exports the handoff log as JSON and imports valid exports.
- Works offline after the first visit.

The app does not upload selected files, access phrases, file names, or handoff sheets. ZIP entry names remain visible before the access phrase is entered. Rename sensitive file names before adding them.

## Try the demo

Choose **Try it with sample data** or open [/?demo=1](https://confidential-file-handoff.sociobot.in/?demo=1). The first view shows two fictional files, Maya, both routes, and the create action.

The demo uses a separate browser database. It never reads or changes the real handoff log. **Reset demo** clears demo activity and restores the sample. **Start for real** clears demo activity before leaving.

See [.factory/demo.md](.factory/demo.md) for the sandbox details. Every reliance claim has one observable test in [.factory/claims.json](.factory/claims.json).

## Limits

This tool does not verify recipients. ZIP entry names remain visible before the access phrase is entered. Rename sensitive file names before adding them.

If opening fails, the handoff sheet names 7-Zip, Keka, and PeaZip. It asks the recipient to report their device and app.

## Run and verify

Requires Node 20 or newer.

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

`npm run build` writes the static site to `dist/`, with `dist/index.html` at its root. Run each command in `.factory/claims.json` from a clean checkout to verify every public claim.

## Privacy and Pro

Read [Privacy](/privacy/) and [Terms](/terms/). Creating the ZIP, handoff sheet, handoff log, and exports remains free.

Pro costs US $9 once and adds a personal note to the handoff sheet. Payment happens on the hosted [Sociobot checkout](https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout), not inside this app.

License checks pass through this product before reaching Sociobot. Responses are not cached. The gateway permits 20 checks per browser in 60 seconds. It keeps an irreversible browser identifier, a count, and a one-minute expiry. A browser result is reused for less than 24 hours and only for its exact token.

## Implementation notes

Demo data uses the IndexedDB database `demo:confidential-file-handoff`; real data uses `confidential-file-handoff`. License checks use the same-origin `/api/license/verify` function, which sends `Cache-Control: no-store`.

## Deploy

This is an Azure Static Web Apps deployment. The static root is `dist/`; `api/` contains the same-origin license gateway.

```sh
/opt/fleet/lib/deploy-static.sh confidential-file-handoff dist
```

## Design and artwork

The dithered security-print visual system and asset provenance are in [.factory/design.md](.factory/design.md). The original artwork was generated for this product. Core use loads no third-party fonts, scripts, analytics, or icon libraries.

## License

[MIT](LICENSE)
