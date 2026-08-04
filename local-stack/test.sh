#!/usr/bin/env bash
# One-command verification of the trust center stack.
#   bash local-stack/test.sh          # assumes stack is up (local-stack/up.sh)
#   bash local-stack/test.sh --full   # also type-checks the API and builds the frontend
set -e
cd "$(dirname "$0")/.."
export DATABASE_URL="${DATABASE_URL:-postgresql://compai@127.0.0.1:5433/compai?schema=public}"

echo "== preflight: services =="
curl -sf http://127.0.0.1:3333/v1/trust-access/autochart/frameworks >/dev/null \
  || { echo "Trust API is not up — run: bash local-stack/up.sh"; exit 1; }
echo "  API OK"

echo "== E2E suite (20 tests: public contract, NDA lifecycle, downloads, domain bypass) =="
(cd apps/api && bun test trust-e2e)

if [ "${1:-}" = "--full" ]; then
  echo "== API type-check =="
  (cd apps/api && bunx tsc --noEmit) && echo "  tsc clean"
  echo "== Frontend production build =="
  (cd apps/trust-center && bunx next build >/dev/null) && echo "  next build clean"
fi

echo ""
echo "All checks passed."
