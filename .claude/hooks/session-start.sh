#!/bin/bash
# SessionStart hook — make a Claude Code on the web session build-ready.
#
# Provisions everything a fresh remote container lacks so that `pnpm test`,
# `pnpm lint`, `pnpm build` and Prisma migrations work with zero manual steps:
#   1. a local PostgreSQL (Supabase is the deploy target; local/CI use plain PG)
#   2. Prisma engine binaries (the egress proxy resets Prisma's own downloader,
#      but allows curl, so we pre-fetch them)
#   3. dependencies + Prisma client + migrations
#
# Synchronous and idempotent. Only runs in remote (web) sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"
echo "[session-start] Provisioning Sell Direct dev environment…"

DB_NAME=sell_direct
DB_URL="postgresql://postgres:dev@127.0.0.1:5432/${DB_NAME}?schema=public"

# ── 1. Local PostgreSQL ───────────────────────────────────────────────────
if ! pg_isready -h 127.0.0.1 -p 5432 -U postgres >/dev/null 2>&1; then
  if ! command -v pg_ctlcluster >/dev/null 2>&1; then
    echo "[session-start] Installing PostgreSQL…"
    sudo apt-get update -y >/dev/null 2>&1 || true
    sudo apt-get install -y postgresql >/dev/null
  fi
  PGVER="$(ls /etc/postgresql 2>/dev/null | sort -V | tail -1)"
  echo "[session-start] Starting PostgreSQL ${PGVER}…"
  sudo pg_ctlcluster "${PGVER}" main start >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do
    pg_isready -h 127.0.0.1 -p 5432 -U postgres >/dev/null 2>&1 && break
    sleep 1
  done
fi

# Password + database (idempotent).
sudo -u postgres psql -tAc "ALTER USER postgres PASSWORD 'dev';" >/dev/null 2>&1 || true
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" >/dev/null
fi

# ── 2. Prisma engines (work around the egress proxy resetting downloads) ───
ENG_HASH="$(grep -oE '@prisma/engines-version@[^: '"'"']*' pnpm-lock.yaml | grep -oE '[0-9a-f]{40}' | head -1 || true)"
ENGINE_ENV=""
if [ -n "${ENG_HASH}" ]; then
  case "$(openssl version 2>/dev/null)" in
    *' 3.'*) TGT=debian-openssl-3.0.x ;;
    *) TGT=debian-openssl-1.1.x ;;
  esac
  ENG_DIR="${HOME}/.cache/sell-direct/prisma-engines/${ENG_HASH}"
  QE="${ENG_DIR}/libquery_engine-${TGT}.so.node"
  SE="${ENG_DIR}/schema-engine"
  if [ ! -f "${QE}" ] || [ ! -x "${SE}" ]; then
    echo "[session-start] Fetching Prisma engines (${TGT})…"
    mkdir -p "${ENG_DIR}"
    base="https://binaries.prisma.sh/all_commits/${ENG_HASH}/${TGT}"
    if curl -fsSL "${base}/libquery_engine.so.node.gz" | gunzip >"${QE}" &&
      curl -fsSL "${base}/schema-engine.gz" | gunzip >"${SE}"; then
      chmod +x "${SE}"
    else
      echo "[session-start] WARN: could not pre-fetch engines; relying on Prisma's downloader"
      rm -f "${QE}" "${SE}"
    fi
  fi
  if [ -f "${QE}" ] && [ -x "${SE}" ]; then
    export PRISMA_QUERY_ENGINE_LIBRARY="${QE}"
    export PRISMA_SCHEMA_ENGINE_BINARY="${SE}"
    export PRISMA_CLI_QUERY_ENGINE_TYPE=library
    ENGINE_ENV="set"
  fi
fi

# ── 3. Persist env vars for the session ────────────────────────────────────
export DATABASE_URL="${DB_URL}"
export DIRECT_URL="${DB_URL}"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export DATABASE_URL=\"${DB_URL}\""
    echo "export DIRECT_URL=\"${DB_URL}\""
    if [ -n "${ENGINE_ENV}" ]; then
      echo "export PRISMA_QUERY_ENGINE_LIBRARY=\"${QE}\""
      echo "export PRISMA_SCHEMA_ENGINE_BINARY=\"${SE}\""
      echo "export PRISMA_CLI_QUERY_ENGINE_TYPE=library"
    fi
  } >>"${CLAUDE_ENV_FILE}"
fi

# ── 4. Dependencies + Prisma client + migrations ───────────────────────────
corepack enable >/dev/null 2>&1 || true
echo "[session-start] Installing dependencies (pnpm)…"
pnpm install --prefer-offline

echo "[session-start] Applying migrations…"
pnpm --filter @sell-direct/api run db:deploy

echo "[session-start] Ready. ✅"
