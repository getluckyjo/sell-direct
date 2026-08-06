# Archive — work that never landed on `main`

Six branches accumulated between 10 and 11 July 2026 that were never merged.
This file records what was in each, and preserves the parts worth keeping so
the branches can be deleted without losing anything.

Archived 6 August 2026.

| Branch | Held | Outcome |
| --- | --- | --- |
| `claude/attorney-led-tier` | 278-line strategy doc + roadmap section | **Kept** → `context/attorney-led-tier.md` |
| `claude/whatsapp-copy-deck` | 355-line copy deck | **Kept** → `context/whatsapp-copy-deck.md` |
| `claude/agent-learning` | Live change to the agent's knowledge base | **Not merged** — see below |
| `claude/green-pastures-sla-nda-g5zg86` | A separate project | Discarded |
| `claude/loom-address` | A merge commit, no file changes | Discarded |
| `claude/repo-rename-refs` | Refs renamed to `sold-direct` | Discarded — stale |

---

## Kept

### `context/attorney-led-tier.md`

A researched, parked commercial tier. The core finding: attorneys and candidate
attorneys are **expressly excluded from the Property Practitioners Act**, so a
partner law firm can market and sell on a seller's behalf without PPRA
registration — funded by the conveyancing fees the seller's nomination brings
the firm, with the seller still paying 0%.

The document covers the legal basis, the economics per mandate, structuring
options (an anchor-firm desk first; an in-house attorney is **not** possible),
compliance ground rules (flat platform fees only — never fee-sharing), and a
build sketch. It also sketches a year-2 captive conveyancing firm: Sold Direct
cannot own a law firm under the Legal Practice Act, but a conveyancer-owned
firm running on our platform under arm's-length licence fees reaches the same
economics.

**Blocked on** attorney sign-off of the fee structure and mandate paperwork
before any build. Nothing here has been reviewed by counsel.

The branch also added a summary of this to `docs/ROADMAP.md`, which has **not**
been carried across — the roadmap has moved on since July, and re-applying a
month-old section would misrepresent where the build actually is.

### `context/whatsapp-copy-deck.md`

Every consumer-journey message in one editable file, written before the copy
lived in code.

**Treat as historical.** The messages that actually ship now live in
`apps/api/src/modules/listings/welcome.ts` and `intake.ts`, and have changed
substantially since — the welcome menu, the one-click intake and the price
guidance all post-date this deck. It is useful as a record of tone and of
journey steps we have not built yet, not as a source of truth for current copy.

---

## Not merged, and why

### `claude/agent-learning`

Unlike the rest, this is **product code, not documentation**: it folds founder
questionnaire answers into `apps/api/src/modules/agent/knowledge.ts`, with
tests, and rewrites `docs/AGENT-QUESTIONS.md`.

Merging it as archive material would silently change what the AI concierge
tells sellers. That is a live behaviour change and deserves a normal pull
request — read the diff, check the answers are still accurate a month on, run
the agent evals — rather than being swept in with a documentation tidy-up.

The branch is preserved for that reason. If the answers are stale, drop it; if
they hold, land it properly.

---

## Discarded

- **`claude/green-pastures-sla-nda-g5zg86`** — a separate project that does not
  belong in this repository.
- **`claude/loom-address`** — contained only a merge commit; no file changes at
  all. The LOOM valuation work it points at is already on `main`.
- **`claude/repo-rename-refs`** — updated `DEPLOYMENT.md` and `status/index.html`
  to say `getluckyjo/sold-direct`. The repository is `getluckyjo/sell-direct`,
  so that rename never happened and applying this would make the references
  wrong. (The *brand* is Sold Direct; the *repository* is sell-direct. Worth
  knowing when reading older documents.)
