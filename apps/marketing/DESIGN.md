# SoldDirect. design rules

The brand system for the marketing site, derived from the master artwork
(`SoldDirect.ai`, 1920×1080, vector). These rules are implemented as Tailwind
tokens in `tailwind.config.ts` and the `Logo` component — change those, not
ad-hoc hex values in pages.

## Logo

The lockup is **"SoldDirect.™"** — one word, bold, with the "o" in "Sold"
drawn as a green speech bubble (the WhatsApp nod), a trailing full stop, and
the trade mark symbol. The wordmark is **outlined vector art, never typeset**:
the exact paths live in `components/logo-paths.ts` (extracted from the master;
regenerate from the .ai if the logo ever changes, don't edit by hand).

The ™ is **not** from the master artwork. It is drawn separately in
`logo-paths.ts` as `TRADEMARK_PATH`, in straight-line geometry, so that it
survives a regeneration of the wordmark and never depends on a font being
available. `LOGO_VIEWBOX_TM` is the box for the lockup as shipped;
`LOGO_VIEWBOX` is the bare master art.

Variants — all rendered by `components/Logo.tsx`:

| Variant | Wordmark | Bubble | Use on |
| --- | --- | --- | --- |
| `light` (primary) | white | green | navy surfaces — nav, footer, ribbon, dark photos |
| `dark` | navy | green | white/light surfaces — print one-pager, documents |

The bubble-only mark (`BUBBLE_PATH`) is the avatar/favicon: `app/icon.svg`
(bubble on navy rounded square). It carries **no ™** — there is no wordmark
on it to mark, and the symbol would be illegible at favicon size.
`public/logo.svg` is the shareable light lockup on transparent, with the ™
baked in as vector so it survives being embedded anywhere.

Rules:

- The bubble is **always** brand green (`#36B44A`), in both variants.
- Never recolor, outline, add a space ("Sold Direct" is prose; the visual
  wordmark is "SoldDirect."), redraw the bubble, or drop the full stop.
- **The ™ goes on every rendering of the lockup and must not be removed.**
  The mark is not registered, so ™ is what asserts the claim in the meantime.
- **Never change the ™ to ®** until a registration certificate exists — using
  ® before registration is a misrepresentation with statutory consequences.
  See `context/trade-mark.md` for where the application stands.
- ™ marks the *logo*, not prose. Body copy says "Sold Direct" plainly.
- Clear space: at least the height of the "S" on all sides. Minimum height
  ~16px on screen; below that use the bubble-only mark.
- Size the component with font-size (`text-lg` etc.) — the lockup is 1em tall.

## Color

Exact brand values from the master file:

| Token | Hex | Master (CMYK) | Role |
| --- | --- | --- | --- |
| `navy` | `#0B172B` | 91 / 80.5 / 52.5 / 67.2 | Brand surface: ribbon, nav, footer, dark overlays |
| `navy-950` | `#060D1A` | — (derived) | Ribbon / darker navy layer |
| `brand-500` | `#36B44A` | 75.3 / 0 / 100 / 0 | The bubble green: logo, avatar, accents on navy |
| white | `#FFFFFF` | 0 / 0 / 0 / 0 | Wordmark on navy; content backgrounds |

The green scale (`brand-50…950`) is built around `brand-500`; shades carry
accessibility roles — don't swap them:

- `brand-600` `#2C9940` — **CTA/button surface** with white text (≥ 3:1).
- `brand-700` `#27873A` — **links and small green text on white** (≥ 4.5:1).
- `brand-300` — green text on navy (ribbon highlights).
- `brand-50/100/200` — light tints for pills, rings, success surfaces.
- `brand-500` is for the logo bubble, the avatar, and large graphics — not
  for text and not as a background for white text.

Usage rules:

- **Navy is the brand's frame, green is its single accent.** Content sections
  stay white/light (`slate` neutrals); navy is reserved for the shell
  (ribbon, nav, footer) and photo overlays. Green marks actions and
  positives: CTAs, links, ticks, prices you keep.
- One green accent per element — no green-on-green stacking.
- WhatsApp UI chrome in the demo keeps WhatsApp's own colors (`#075E54`
  etc.); it depicts their product, not our brand.

## Type

- The wordmark is artwork — never try to reproduce it with a font.
- UI/body type is the system sans stack (Tailwind default), close to the
  master's grotesque. Weights: `font-extrabold` display headlines,
  `font-bold` headings, `font-semibold` CTAs/labels, regular body.
- Numbers sellers care about (R0, 1%, savings) get display weight and, when
  positive, `brand-600`/`brand-700`.

## Voice

All copy follows the positioning guardrails in the repo `CLAUDE.md`: never
anti-agent, never anti-PPRA; savings framed neutrally ("what a full-service
sale would have cost"), en-ZA, ZAR, DD/MM/YYYY.
