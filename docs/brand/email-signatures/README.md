# Email signatures

Brand signatures for the Sold Direct team. One file per person; the logo is a
hosted PNG at `https://www.solddirect.co.za/email/signature-logo.png`
(source: `apps/marketing/public/email/`), so signatures work in every mail
client without attachments.

**Install (Gmail):** open the person's `.html` file in a browser, select all
(Ctrl/Cmd+A), copy, then Gmail → Settings → See all settings → General →
Signature → paste. Apple Mail and Outlook: paste into Settings → Signatures
the same way.

To add a person, copy an existing file and change the name, title and email.
Colors and rules come from `apps/marketing/DESIGN.md`.

## Regenerating the logo PNG

`signature-logo.png` is derived from `apps/marketing/public/logo.svg` — the
light lockup (no ™ — founder decision, Aug 2026), fitted onto a navy
`#0B172B` rounded rectangle:

| | |
| --- | --- |
| Canvas | 440 × 128, corner radius 14 |
| Lockup | 388 wide, 26px padding each side, vertically centred |

**Keep the canvas at 440 × 128.** Signatures already pasted into people's mail
clients hard-code `width="220" height="64"` against this same hosted URL, so
changing the aspect ratio would distort every signature already installed. If
the lockup grows wider, scale it down to fit rather than widening the canvas.

Rasterised with `sharp` (already in the workspace via Next). Check the result
at 220px wide, not just full size — that is where it actually renders.
