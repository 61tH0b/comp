# Run the Autochart trust center on your Mac (Docker)

One command brings up the whole stack — Postgres, MinIO (object storage), the
trust API, and the trust center frontend — with the Autochart demo data seeded.

## Prerequisites
- **Docker Desktop** (macOS or Linux). That's it — you don't need Postgres,
  Node, or bun installed locally.

## Run
```bash
# from the repo root, on branch claude/vanta-autochart-migration-plan-6lorL
cd local-stack
docker compose up --build
```
First run builds the image and can take a few minutes (installs deps + builds
the workspace packages). Subsequent runs are fast.

When it's up:
- **Trust center:** http://localhost:3003
- **Trust API:** http://localhost:3333/v1/trust-access/autochart/frameworks
- **MinIO console:** http://localhost:9001  (login `compai` / `compai12345`)

## Try the NDA flow (email is mocked)
Emails aren't sent — they're written to `local-stack/.emails/emails.jsonl`
inside the `trust-api` container. To walk the flow:

1. Open http://localhost:3003 and click **Request Access to Documentation**, submit the form.
2. Approve it (the one step that needs an org member) and capture the NDA link:
   ```bash
   docker compose exec trust-api sh -c "cd /app/apps/api && bun drive-approve.ts 'Jane Auditor' 'jane@acme.com' 'Acme' 'Auditor'"
   ```
   It prints an `ndaUrl` like `http://localhost:3003/nda/<token>`.
3. Open that URL, sign the NDA.
4. Grab the access link from the captured emails:
   ```bash
   docker compose exec trust-api sh -c "cat /app/local-stack/.emails/emails.jsonl"
   ```
   Open the `Access Granted` link (`http://localhost:3003/autochart/access/<token>`)
   to see the gated portal with the watermarked signed NDA.

## Stop / reset
```bash
docker compose down           # stop
docker compose down -v        # stop and wipe the database + object storage
```

## Notes
- **Email** is mocked (`MOCK_EMAIL=true`); set a real `RESEND_API_KEY` and drop
  `MOCK_EMAIL` in `docker-compose.yml` to actually send.
- **Redis** is mocked in-process (`MOCK_REDIS=true`) — the trust endpoints don't
  need a separate Redis for local use.
- **Custom domain / Auth** (Vercel, Google/MS OAuth) aren't needed locally and
  are left unset.
- Ports 5433 (Postgres), 9000/9001 (MinIO), 3333 (API), 3003 (web) must be free.
