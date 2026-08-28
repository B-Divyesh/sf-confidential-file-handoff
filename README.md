# Confidential File Handoff

Confidential File Handoff is a local-first PWA for people sending sensitive tax, medical, legal, or credential files to someone who should not need technical help. It creates a standard AES-encrypted ZIP in the browser, writes a plain-language recipient handoff sheet, and keeps a small local acknowledgement checklist.

Live: https://confidential-file-handoff.sociobot.in

## What it does

- Creates an AES-protected `confidential-handoff.zip` on the sender’s device; the app does not upload selected files or the ZIP password.
- Produces a recipient sheet that explicitly separates the ZIP delivery route from the password route.
- Keeps an IndexedDB checklist with only recipient name, dates, and the selected routes—not file names, file contents, or passwords.
- Lets the sender export/import that checklist as JSON.
- Works after install and offline once the app shell has been opened.

This is a handoff aid, not identity verification, a secure transfer service, malware scanning, or medical/legal/compliance certification. Read the in-app threat model before using it for an important exchange.

## Develop and verify

Requires Node 20+.

```sh
npm install
npm run dev
npm test
npm run build
```

`npm run build` writes the static deployable site to `dist/`, with `dist/index.html` at its root.

## Privacy and paid unlock

See [/privacy/](/privacy/) and [/terms/](/terms/). The free core workflow is complete. A one-time Pro license, sold by Sociobot/Dodo, unlocks a personal note on the recipient sheet; the product uses the Sociobot license endpoint and never embeds a payment provider.

## Design and source artwork

The visual system and original-art provenance are documented in [.factory/design.md](.factory/design.md). The artwork is generated specifically for this product; no runtime third-party fonts, scripts, analytics, or icon libraries are used.
