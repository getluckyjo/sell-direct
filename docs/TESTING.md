# Testing the seller journey end to end

Three levels, cheapest first. The unit suite is what CI runs; the simulation is
what you run before showing anyone, or after touching the conversation.

| Level | Command | Touches the database |
| --- | --- | --- |
| Unit + integration | `pnpm --filter @sell-direct/api test` | no |
| Playable demo | open `/demo` on a running API | yes |
| Seller simulation | `pnpm --filter @sell-direct/api sim` | yes |

## 1. The unit suite

```bash
pnpm --filter @sell-direct/api test
```

No database, no network, no API key. Covers the deal state machine, the intake
machine, the WhatsApp adapters, every consent path and the money parsing.

## 2. The seller simulation

Twenty personas driven through the **real** pipeline — production dispatcher,
real state machine, real Postgres writes. Each behaves like a person rather
than a script tuned to pass: perfect tappers, people who type every answer, a
suburb that isn't on the list, `3.5m` as a price, an implausible price, an edit
at the summary, a cancel, an abandon, a studio, vacant land, gibberish, and a
question asked mid-flow.

### Run it

```bash
# 1. Postgres
docker run -d --name selldirect-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16

export DATABASE_URL='postgresql://postgres:dev@localhost:5432/postgres?schema=public'
export DIRECT_URL="$DATABASE_URL"
pnpm --filter @sell-direct/api run db:deploy

# 2. The API, with the AI layer on (see below for what changes without it)
export ANTHROPIC_API_KEY='sk-ant-...'
export AGENT_ENABLED=true
export PORT=4100
pnpm --filter @sell-direct/api start

# 3. In another terminal — RUN_ID must be 1–5 digits, and one you have not used before
RUN_ID=42 pnpm --filter @sell-direct/api sim
```

There is no `.env` loading in this app, so those `export`s are load-bearing.

### RUN_ID

Personas use deterministic phone numbers (`+2700<run id, 5 digits><persona, 2 digits>`, inside the
reserved demo range that can never reach a real seller). Re-using a `RUN_ID`
would resume the previous run's conversations mid-flow and the output would
look like product bugs that aren't there — so the script **refuses to start**
if any of its numbers already has history. Bump the id, or reset:

```sql
DELETE FROM conversation_states; DELETE FROM listings; DELETE FROM sellers;
```

### Reading the output

```
personas          20
published         18 of 18 expected      ← the number that matters
turns exchanged   238

INPUTS CORRECTED / LOOPS:
  · Lerato turn 7: "50000" → I didn't catch that as a price…
```

Two personas are *designed* not to publish — one cancels at the summary, one
abandons — so 18 of 18 is a clean run.

- `·` a correction. Some are correct (an implausible price should be refused).
  Ask whether a real seller would have understood the reply.
- `!` the same reply twice in a row — a possible loop, always worth a look.
- `!!` an HTTP error or a missing reply. Never acceptable.

`FORMAT=json` prints full transcripts for every turn.

### With and without the AI key

The simulation runs either way, and the difference is worth knowing:

| | Without `ANTHROPIC_API_KEY` | With it |
| --- | --- | --- |
| Guided intake | fully works | fully works |
| "sell my 4 bed in Mowbray" | asks each field in turn | fills three fields at once |
| Description writer | offers to skip | drafts, seller approves |
| Concierge | canned menu | answers off-script questions |

Running **without** the key tests the deterministic floor — what a seller gets
when the model is unavailable. That is the more important guarantee, and worth
running deliberately even once the key is configured.

### What to check in the database afterwards

```sql
SELECT count(*) AS listings, count(DISTINCT "sellerId") AS sellers FROM listings;
SELECT "propertyType", suburb, "priceZar", bedrooms, bathrooms FROM listings;
SELECT direction, count(*) FROM messages GROUP BY direction;   -- should balance
SELECT phone, step FROM conversation_states;                   -- abandoned drafts
```

Anything left in `conversation_states` is a seller who stopped part-way. The
re-engagement sweep nudges each of those once, six hours after they go quiet.

## 3. The playable demo

`GET /demo` on any running API. Same pipeline, driven by hand. Locked to the
reserved `+2700` range, and switched off with `DEMO_ENABLED=false`.

`pnpm --filter @sell-direct/api build:demo` produces a standalone HTML file
that needs no server at all — useful for sharing, but it runs the conversation
in the browser and writes nothing to the database.
