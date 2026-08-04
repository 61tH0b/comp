#!/usr/bin/env bash
# Launch the public Trust Center frontend (Next.js) for trust.autochart.ai.
set -e
cd "$(dirname "$0")/../apps/trust-center"
exec bunx next dev -p 3003
