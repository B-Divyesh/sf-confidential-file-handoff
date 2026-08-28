# Confidential File Handoff — visual thesis

## Direction

**Dithered / halftone print system.** This is a tool for a small, careful human ritual: packing papers, passing a sealed envelope, and giving someone exact instructions. The UI borrows from a two-colour security-printing desk rather than a cloud-storage dashboard. Large inked labels, paper-toned fields, perforation-like rules, and a single halftone illustration make the procedure feel deliberate without pretending that it is a security product or a vault.

## Tokens

| Role | Light ink value | Dark ink value |
| --- | --- | --- |
| Ground | `#f5f0e3` (warm paper) | `#172226` (night ink) |
| Surface | `#fffdf6` | `#203238` |
| Primary text | `#1d292d` | `#f8f1e2` |
| Muted text | `#536064` | `#c2ccc7` |
| Teal seal / accent | `#006f70` | `#72d3c8` |
| Vermilion warning | `#a9331b` | `#ff9f88` |
| Gold marker | `#b16b00` | `#ffd073` |
| Success | `#17643d` | `#91e0af` |

The site honours the system colour preference; both treatments retain paper/ink contrast. Teal and vermilion are never the only state signal.

## Type, spacing, and interaction

`Georgia` provides the editorial, printed-procedure voice for display headings; the locally available system sans stack (`Inter`-like system UI) keeps instructions crisp and accessible. The scale is 14 / 16 / 18 / 24 / 36 / 52px; body text is 17px with 1.55 line height. Spacing follows a 4px rhythm, with generous 24–48px gaps between procedure stages. Labels use compact uppercase tracking, not as body copy.

There are no floating dashboard cards: steps sit on an open paper sheet, marked by an inked number and a low-contrast dotted rule. Controls have 44px minimum targets and a teal inset focus ring. The file is represented as a sealed packet: selecting it gives way to a visible preparation action, and completion opens a clearly labelled handoff kit.

Motion is functional only: the progress meter fills in 180ms and the handoff kit appears with a 180ms opacity/translate transition. Under `prefers-reduced-motion`, states change instantly. No looping animation or flashing is used.

The update notice uses fixed night-ink and warm-paper colors in both system themes so it reads as an operational layer, not page decoration. Its visibility is controlled by the native `hidden` state and it appears only when a newly activated content-versioned worker has claimed an existing page. Persisted acknowledgement controls remain in the open log row rather than becoming separate cards, preserving the printed-checklist interaction grammar.

## Original asset plan and provenance

One original hero illustration, `assets/src/print-desk.png`, depicts a closed document packet, a key card, and a phone as simplified editorial objects on stippled paper. It is decorative (`alt=""`) because the adjacent copy states the procedure. Prompt sheet: **subject** a confidential document handoff desk; **world/materials** two-colour risograph security print, heavy halftone dots and grainy recycled paper; **light** flat studio print lighting; **lens** straight-on editorial still life; **palette** warm ivory, deep blue-green, rust vermilion, restrained mustard; **negative list** readable text, watermark, logos, brands, people, medical/legal symbols, photorealism. Generated with the factory Azure image model on 2026-08-28; original product artwork, no third-party licence needed. The reviewed final is converted to WebP for delivery; source prompt is retained alongside it.

The app also draws simple locks, checkmarks, and arrow marks as authored inline SVG/CSS shapes—no icon library.
