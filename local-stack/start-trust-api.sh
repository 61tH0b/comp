#!/usr/bin/env bash
# Launch the scoped Trust Center API (trust-portal module only).
set -e
cd "$(dirname "$0")/../apps/api"
export DATABASE_URL="${DATABASE_URL:-postgresql://compai@127.0.0.1:5433/compai?schema=public}"
exec bun trust-server.ts
