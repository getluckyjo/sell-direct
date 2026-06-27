# Deployment guide (staging)

A step-by-step guide to put Sell Direct online. Written for a non-developer —
follow it top to bottom. **You never put secrets in the repo**; every key goes
into a hosting dashboard.

What we deploy:

| Part | What it is | Host |
| --- | --- | --- |
| `apps/api` | Backend (WhatsApp webhook, leads, dashboard API) | Railway (or Render) |
| Postgres | Database | Supabase |
| `apps/web` | Internal dashboard (control room) | Vercel |
| `apps/marketing` | Public marketing site + waitlist | Vercel |
| `apps/fundraising` | Investor teaser + data-room request | Vercel |

## 0. Accounts you need

- **GitHub** (the repo is already here).
- **Supabase** — managed Postgres + Auth + Storage. See `docs/SUPABASE.md`.
- **Railway** (or Render) — to run the backend.
- **Vercel** — to run the three websites.
- **Meta / WhatsApp Business Platform** (or a BSP: Clickatell / 360dialog /
  Twilio) — only needed to make WhatsApp live.

## 1. Database — Supabase

1. Create a Supabase project (region near Cape Town).
2. From **Settings → Database**, copy the **pooled** (port 6543) and **direct**
   (port 5432) connection strings. These become `DATABASE_URL` (add
   `?pgbouncer=true`) and `DIRECT_URL`. Full detail in `docs/SUPABASE.md`.

## 2. Backend — Railway

1. New project → **Deploy from GitHub repo** → pick this repo.
2. Settings:
   - **Install command:** `pnpm install`
   - **Start command:** `pnpm --filter @sell-direct/api start`
   - **Pre-deploy / release command:** `pnpm --filter @sell-direct/api db:deploy`
     (applies database migrations)
3. **Variables** (Railway dashboard — never the repo):
   - `DATABASE_URL`, `DIRECT_URL` (from Supabase)
   - `NODE_ENV=production`
   - `INTERNAL_API_TOKEN` — invent a long random string (the dashboard uses it)
   - WhatsApp (when ready): `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`,
     `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`
   - `FIELD_ENCRYPTION_KEY` (for later, when sensitive PII is added)
   - Railway sets `PORT` automatically — the server already reads it.
4. Deploy. Visit `https://<your-api>.up.railway.app/health` → it should return
   `{"status":"ok","service":"Sell Direct"}`.

> Render is equivalent: a Web Service, same install/start/migrate commands.

## 3. Websites — Vercel (three projects)

Create **three** Vercel projects from the same repo, each with a different
**Root Directory**:

| Project | Root Directory | Variables |
| --- | --- | --- |
| Dashboard | `apps/web` | `API_INTERNAL_URL` = your Railway API URL · `INTERNAL_API_TOKEN` = same as the API · `DASHBOARD_BASIC_AUTH` = `user:password` you choose |
| Marketing | `apps/marketing` | `API_INTERNAL_URL` = your Railway API URL |
| Fundraising | `apps/fundraising` | `API_INTERNAL_URL` = your Railway API URL |

For each: Framework **Next.js** (auto-detected), Install command `pnpm install`.
Vercel handles the monorepo automatically once the Root Directory is set.

After deploy you'll have three URLs (e.g. `dashboard.vercel.app`,
`marketing.vercel.app`, `invest.vercel.app`). Point your real domains at them
later.

## 4. WhatsApp webhook (when going live)

1. In the Meta WhatsApp app (or your BSP), set the webhook URL to
   `https://<your-api>/api/webhooks/whatsapp` and the **Verify Token** to the
   same value as `WHATSAPP_VERIFY_TOKEN`.
2. Meta calls `GET` to verify (the API echoes the challenge), then sends inbound
   messages to `POST`. Subscribe to the **messages** field.

## 5. Smoke test

- API: `GET /health` is OK.
- Marketing: open the site, submit the waitlist → a row appears in Supabase
  `leads` (kind `waitlist`).
- Fundraising: submit the data-room request → `leads` (kind `investor`).
- Dashboard: open it (enter the basic-auth user/password) → Listings and Deals
  load.

## Security checklist

- No secrets committed — all live in host dashboards.
- Test/sandbox keys only until you're truly in production.
- `INTERNAL_API_TOKEN` set, so the dashboard API isn't world-readable.
- `DASHBOARD_BASIC_AUTH` set, so the dashboard is gated.
- Sign a **DPA** with Supabase (and any BSP / originator) before real personal
  data flows. See `SECURITY.md` and `docs/POPIA-data-map.md`.
