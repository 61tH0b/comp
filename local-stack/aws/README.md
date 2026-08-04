# AWS deployment — trust center backend (staging)

Deploys ONLY the backend to AWS in `ca-central-1` (Canadian data residency for
PIPEDA/PHIPA). **No DNS changes, nothing touches trust.autochart.ai.** The API
gets a private-ish `*.awsapprunner.com` HTTPS URL for testing.

## Architecture

```
GitHub branch ──(zip)──> S3 source bucket
                             │
                             ▼
                        CodeBuild  ──build docker image──> ECR
                                                            │
                                                            ▼
   RDS Postgres (db.t4g.micro) <── App Runner service (trust-server.ts)
   S3 buckets (assets/uploads)  <──┘
```

- **App Runner** — cheapest managed HTTPS container runtime (~$12–15/mo,
  no load balancer fee). Runs the scoped `trust-server.ts`.
- **RDS PostgreSQL** `db.t4g.micro` single-AZ (~$15/mo incl. 20 GB).
- **S3** — org assets + uploads (pennies).
- **CodeBuild** — builds the Docker image remotely (this sandbox has no
  Docker daemon); also runs `prisma migrate deploy` + seed against RDS.
- **Email** — starts with `MOCK_EMAIL=true` (captured, not sent). Flip to a
  real `RESEND_API_KEY` when ready.

Everything is tagged `project=autochart-trust-staging`.

## Cost & teardown

~$25–30/mo on-demand, covered by credits. `teardown-aws.sh` deletes every
resource (App Runner, RDS incl. snapshots, ECR, CodeBuild, S3 buckets, IAM
roles) so nothing lingers if we don't proceed.

## Credentials needed

An IAM access key for a user/role that can manage: App Runner, RDS, S3, ECR,
CodeBuild, IAM (create service roles), Secrets Manager, and VPC security
groups — admin on a sandbox/credit account is simplest. Provide via env:

```bash
export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=ca-central-1
bash local-stack/aws/deploy-aws.sh
```

## Run order

1. `deploy-aws.sh infra`   — buckets, ECR, RDS (waits for RDS ~10 min)
2. `deploy-aws.sh build`   — zip source → CodeBuild → image in ECR
3. `deploy-aws.sh migrate` — CodeBuild run: prisma migrate deploy + seed
4. `deploy-aws.sh app`     — App Runner service + env wiring
5. `deploy-aws.sh smoke`   — curl the public URL; then run the E2E suite
   against it: `E2E_API_URL=https://<id>.ca-central-1.awsapprunner.com bun test trust-e2e`

(`deploy-aws.sh` with no args runs all stages in order.)
