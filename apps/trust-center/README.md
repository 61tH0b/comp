# Trust Center — trust.autochart.ai

Public trust center frontend for Autochart.ai (Aya Health Technologies), backed by
the Comp AI trust-access API. Stateless: all data lives in the Comp AI backend.

## Routes
| Route | Purpose |
|---|---|
| `/` | Public homepage — compliance badges, overview, FAQ, subprocessors, resource links |
| `/nda/[token]` | NDA review + signing |
| `/access/[token]` | Gated portal — policies, certificates, documents (post-NDA) |

## Env
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Comp AI API base (e.g. `https://api.example.com/v1`) |
| `NEXT_PUBLIC_ORG_SLUG` | Trust portal friendly URL / org id |
| `NEXT_PUBLIC_ORG_NAME` | Display name (default `Autochart.ai`) |

## Develop
```bash
cp .env.example .env.local   # point at your API
bun install && bunx next dev -p 3003
```

## Deploy
- **Vercel**: root dir `apps/trust-center`, add `trust.autochart.ai` as a custom domain (CNAME → `cname.vercel-dns.com`).
- **Docker/Azure**: `docker build -t trust-center .` (see `Dockerfile`).

## API endpoints consumed
Public: `:slug/{overview,frameworks,faqs,vendors,custom-links,favicon}`, `:slug/{requests,reclaim}`.
NDA: `nda/:token{,/preview-nda,/sign}`. Gated: `access/:token{,/policies,/compliance-resources,/documents,...}`.

See `local-stack/` at the repo root for a full no-Docker local environment.
