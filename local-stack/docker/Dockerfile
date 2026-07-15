# Image for the scoped Trust Center backend + frontend (monorepo build).
# Used by three compose services (migrate-seed, trust-api, trust-center) with
# different commands. Build context is the repo root.
FROM oven/bun:1.3

WORKDIR /app

# curl for container healthchecks; openssl is already present (bookworm) for Prisma
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the repo (node_modules/.next excluded via .dockerignore) and install
COPY . .
RUN bun install

# Build the workspace packages the trust API needs (fail hard on the critical
# three; best-effort for the rest). Also generates the Prisma client.
RUN cd packages/db && bun run build
RUN cd packages/email && bun run build
RUN cd packages/integration-platform && bun run build
RUN for d in packages/*/; do \
      if [ -f "$d/package.json" ]; then (cd "$d" && bun run build) || true; fi; \
    done

EXPOSE 3333 3003
