# Local Stack — trust.autochart.ai

Runs the Autochart trust center end-to-end on a single machine with **no Docker**,
using local Postgres, Redis, and MinIO (S3-compatible) plus a scoped NestJS API
and the Next.js frontend.

## Components brought up

| Service | Requirement | Local implementation | Port |
|---|---|---|---|
| **Postgres** | Database | `/usr/lib/postgresql/16` (run as unprivileged `pg` user) | 5433 |
| **Object storage** | S3 | MinIO (`APP_AWS_ENDPOINT`) + buckets | 9000 / 9001 |
| **Redis** | Cache / rate limit | `redis-server` (+ `MOCK_REDIS=true` for the Upstash-REST kv layer) | 6380 |
| **Email** | Resend | placeholder key (`RESEND_API_KEY`) — requests still persist; set a real key to send | — |
| **Custom domain** | Vercel API | placeholder `VERCEL_ACCESS_TOKEN` — not exercised locally | — |
| **Auth** | Better Auth | local `BETTER_AUTH_SECRET`; public trust endpoints need no auth | — |
| **Trust API** | Backend | `apps/api/trust-server.ts` (scoped to TrustPortalModule) | 3333 |
| **Trust Center** | Frontend | `apps/trust-center` (Next.js) | 3003 |

## One-time setup

1. **Infra** (Postgres/Redis/MinIO) — install dirs live under `/root/local-stack-data`
   and `/home/pg/data`. Postgres must run as a non-root user.
2. **DB**: from `packages/db`: `bunx prisma migrate deploy` then `bunx prisma generate`.
3. **Build workspace packages**: `bunx turbo run build --filter='./packages/*'`.
4. **Seed Autochart data**:
   ```bash
   DATABASE_URL="postgresql://compai@127.0.0.1:5433/compai?schema=public" \
     bun local-stack/seed-autochart.ts
   ```

## Run

```bash
# Backend (trust-access + trust-portal endpoints) on :3333
bash local-stack/start-trust-api.sh

# Frontend on :3003 (reads NEXT_PUBLIC_API_URL=http://127.0.0.1:3333/v1)
bash local-stack/start-trust-center.sh
```

## Smoke test

```bash
curl http://127.0.0.1:3333/v1/trust-access/autochart/frameworks
curl http://127.0.0.1:3333/v1/trust-access/autochart/overview
curl -X POST http://127.0.0.1:3333/v1/trust-access/autochart/requests \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"a@b.com","company":"B","jobTitle":"C","purpose":"D"}'
open http://127.0.0.1:3003/
```

## Env files (git-ignored — create locally)

- `packages/db/.env` — `DATABASE_URL`
- `apps/api/.env` — DB + `APP_AWS_*` (MinIO) + `MOCK_REDIS=true` + auth/email/vercel placeholders
- `apps/trust-center/.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ORG_SLUG`
