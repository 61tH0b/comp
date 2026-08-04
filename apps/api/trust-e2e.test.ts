/**
 * End-to-end tests for the Trust Center backend (trust.autochart.ai).
 *
 * Exercises the REAL running stack over HTTP (trust-server on :3333, Postgres,
 * MinIO, mocked email capture). Admin approval — the only step that requires an
 * org member — is driven through the actual TrustAccessService in an
 * application context, same as the admin UI would.
 *
 * Prereqs: bash local-stack/up.sh  (stack up + seeded)
 * Run:     cd apps/api && bun test trust-e2e
 */
import './src/config/load-env';
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { readFileSync, existsSync } from 'fs';
import { db } from '@trycompai/db';
import { TrustPortalModule } from './src/trust-portal/trust-portal.module';
import { TrustAccessService } from './src/trust-portal/trust-access.service';

const API = 'http://127.0.0.1:3333/v1/trust-access';
const SLUG = 'autochart';
const EMAILS_FILE = process.env.MOCK_EMAIL_DIR
  ? `${process.env.MOCK_EMAIL_DIR}/emails.jsonl`
  : '/root/local-stack-data/emails.jsonl';

const RUN = Date.now();
const REQUESTER = {
  name: 'E2E Reviewer',
  email: `e2e-${RUN}@northwind-health.com`,
  company: 'Northwind Health',
  jobTitle: 'CISO',
  purpose: 'Automated E2E: vendor due diligence',
};
const INSIDER = {
  name: 'E2E Insider',
  email: `e2e-insider-${RUN}@autochart.ai`,
  company: 'Aya Health',
  jobTitle: 'Engineer',
  purpose: 'Automated E2E: domain bypass',
};

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TrustPortalModule] })
class TestModule {}

let appCtx: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>;
let svc: TrustAccessService;
let orgId: string;
let memberId: string;
let emailOffset = 0;

// state carried across sequential tests
let requestId = '';
let ndaToken = '';
let accessToken = '';

function newEmails(): { to: string; subject: string; links: string[] }[] {
  if (!existsSync(EMAILS_FILE)) return [];
  const lines = readFileSync(EMAILS_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(emailOffset).map((l) => JSON.parse(l));
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, body };
}

beforeAll(async () => {
  appCtx = await NestFactory.createApplicationContext(TestModule, { logger: ['error'] });
  svc = appCtx.get(TrustAccessService);

  const org = await db.organization.findFirst({ where: { name: 'Aya Health Technologies' } });
  if (!org) throw new Error('Seed missing — run local-stack/seed-autochart.ts');
  orgId = org.id;
  const member = await db.member.findFirst({ where: { organizationId: orgId, role: 'owner' } });
  if (!member) throw new Error('Owner member missing — run seed');
  memberId = member.id;

  if (existsSync(EMAILS_FILE)) {
    emailOffset = readFileSync(EMAILS_FILE, 'utf8').trim().split('\n').filter(Boolean).length;
  }
});

afterAll(async () => {
  await appCtx?.close();
});

// ---------------------------------------------------------------------------
describe('public content endpoints', () => {
  test('frameworks: enabled + compliant, includes PIPEDA & PHIPA', async () => {
    const { status, body } = await api(`${SLUG}/frameworks`);
    expect(status).toBe(200);
    const slugs = body.frameworks.map((f: any) => f.slug).sort();
    expect(slugs).toEqual(['gdpr', 'hipaa', 'phipa', 'pipeda', 'soc2_type2']);
    for (const f of body.frameworks) {
      expect(f.enabled).toBe(true);
      expect(f.status).toBe('compliant');
      expect(typeof f.name).toBe('string');
    }
  });

  test('overview: {title, content}', async () => {
    const { status, body } = await api(`${SLUG}/overview`);
    expect(status).toBe(200);
    expect(body.title).toBe('Security & Compliance');
    expect(body.content).toContain('Aya Health Technologies');
  });

  test('faqs: 6 entries with question/answer/order', async () => {
    const { status, body } = await api(`${SLUG}/faqs`);
    expect(status).toBe(200);
    expect(body.faqs.length).toBe(6);
    expect(body.faqs[0]).toHaveProperty('question');
    expect(body.faqs[0]).toHaveProperty('answer');
  });

  test('vendors: array with {type,label} badges', async () => {
    const { status, body } = await api(`${SLUG}/vendors`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(4);
    const azure = body.find((v: any) => v.name === 'Microsoft Azure');
    expect(azure.complianceBadges.map((b: any) => b.type)).toContain('iso27001');
    expect(azure.complianceBadges[0]).toHaveProperty('label');
  });

  test('custom-links: 5 ordered links', async () => {
    const { status, body } = await api(`${SLUG}/custom-links`);
    expect(status).toBe(200);
    expect(body.length).toBe(5);
    expect(body[0].title).toBe('Privacy Policy');
  });

  test('favicon: null when unset', async () => {
    const { status, body } = await api(`${SLUG}/favicon`);
    expect(status).toBe(200);
    expect(body.faviconUrl).toBeNull();
  });

  test('unknown slug → 404 on frameworks', async () => {
    const { status } = await api('definitely-not-a-real-org/frameworks');
    expect(status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
describe('NDA access lifecycle', () => {
  test('submit access request → 201 under_review', async () => {
    const { status, body } = await api(`${SLUG}/requests`, {
      method: 'POST',
      body: JSON.stringify(REQUESTER),
    });
    expect(status).toBe(201);
    expect(body.status).toBe('under_review');
    requestId = body.id;
    expect(requestId).toStartWith('tar_');
  });

  test('duplicate pending request → 400', async () => {
    const { status, body } = await api(`${SLUG}/requests`, {
      method: 'POST',
      body: JSON.stringify(REQUESTER),
    });
    expect(status).toBe(400);
    expect(body.message).toContain('pending request');
  });

  test('admin approve → NDA created + signing email captured', async () => {
    const result: any = await svc.approveRequest(
      orgId,
      requestId,
      { durationDays: 30 } as any,
      memberId,
    );
    expect(result.ndaAgreement?.signToken).toBeTruthy();
    ndaToken = result.ndaAgreement.signToken;

    const mail = newEmails().find(
      (e) => e.to === REQUESTER.email && /NDA Signature Required/i.test(e.subject),
    );
    expect(mail).toBeTruthy();
    expect(mail!.links.some((l) => l.includes(`/nda/${ndaToken}`))).toBe(true);
  });

  test('GET nda/:token → requester details', async () => {
    const { status, body } = await api(`nda/${ndaToken}`);
    expect(status).toBe(200);
    expect(body.requesterEmail ?? body.email).toBe(REQUESTER.email);
    expect(body.organizationName).toBe('Aya Health Technologies');
  });

  test('invalid nda token → 404', async () => {
    const { status } = await api('nda/not-a-real-token-1234567890');
    expect(status).toBe(404);
  });

  test('sign NDA → grant created + access email captured', async () => {
    const { status, body } = await api(`nda/${ndaToken}/sign`, {
      method: 'POST',
      body: JSON.stringify({ name: REQUESTER.name, email: REQUESTER.email, accept: true }),
    });
    expect(status).toBe(200);
    expect(JSON.stringify(body)).toContain('signed');

    const mail = newEmails().find(
      (e) => e.to === REQUESTER.email && /Access Granted/i.test(e.subject),
    );
    expect(mail).toBeTruthy();
    const link = mail!.links.find((l) => /\/access\//.test(l));
    expect(link).toBeTruthy();
    accessToken = link!.split('/access/')[1].split(/[?#]/)[0];
    expect(accessToken.length).toBeGreaterThan(10);
  });

  test('grant data includes downloadable watermarked NDA PDF (MinIO)', async () => {
    const { status, body } = await api(`access/${accessToken}`);
    expect(status).toBe(200);
    expect(body.organizationName).toBe('Aya Health Technologies');
    expect(body.subjectEmail).toBe(REQUESTER.email);
    expect(body.ndaPdfUrl).toBeTruthy();

    const pdf = await fetch(body.ndaPdfUrl);
    expect(pdf.status).toBe(200);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const magic = String.fromCharCode(...bytes.slice(0, 5));
    expect(magic).toBe('%PDF-');
  });

  test('gated listings are BARE ARRAYS (frontend contract)', async () => {
    // All three gated listing endpoints return arrays directly, not wrapped
    // objects — the frontend api.ts depends on this.
    const pol = await api(`access/${accessToken}/policies`);
    expect(pol.status).toBe(200);
    expect(Array.isArray(pol.body)).toBe(true);
    // seeded published policy is listed with `name` (not `title`)
    const seededPolicy = pol.body.find((p: any) => p.name === 'Information Security Policy');
    expect(seededPolicy).toBeTruthy();

    const docs = await api(`access/${accessToken}/documents`);
    expect(docs.status).toBe(200);
    expect(Array.isArray(docs.body)).toBe(true);
    expect(docs.body.find((d: any) => d.name === 'Security Whitepaper.pdf')).toBeTruthy();

    const res = await api(`access/${accessToken}/compliance-resources`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('per-document download → {signedUrl} serving the PDF from object storage', async () => {
    const docs = await api(`access/${accessToken}/documents`);
    const doc = docs.body.find((d: any) => d.name === 'Security Whitepaper.pdf');
    const dl = await api(`access/${accessToken}/documents/${doc.id}`);
    expect(dl.status).toBe(200);
    // NB: per-item downloads return `signedUrl`, aggregates return `downloadUrl`
    expect(dl.body.signedUrl).toBeTruthy();
    expect(dl.body.fileName).toBe('Security Whitepaper.pdf');

    const pdf = await fetch(dl.body.signedUrl);
    expect(pdf.status).toBe(200);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });

  test('invalid access token → 404', async () => {
    const { status } = await api('access/definitely-invalid-token');
    expect(status).toBe(404);
  });

  test('new request while grant active → 201 already_approved (graceful)', async () => {
    const { status, body } = await api(`${SLUG}/requests`, {
      method: 'POST',
      body: JSON.stringify(REQUESTER),
    });
    expect(status).toBe(201);
    expect(body.status).toBe('already_approved');
    expect(body.grant?.expiresAt).toBeTruthy();
  });

  test('reclaim access → fresh access link emailed', async () => {
    const { status } = await api(`${SLUG}/reclaim`, {
      method: 'POST',
      body: JSON.stringify({ email: REQUESTER.email }),
    });
    expect(status).toBe(200);
    const mails = newEmails().filter(
      (e) => e.to === REQUESTER.email && /Access/i.test(e.subject),
    );
    const last = mails[mails.length - 1];
    expect(last.links.some((l) => /\/access\//.test(l))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('allowed-domain bypass', () => {
  test('@autochart.ai requester skips NDA and gets direct grant', async () => {
    const created = await api(`${SLUG}/requests`, {
      method: 'POST',
      body: JSON.stringify(INSIDER),
    });
    expect(created.status).toBe(201);

    await svc.approveRequest(orgId, created.body.id, { durationDays: 30 } as any, memberId);

    // no NDA agreement should exist for this request
    const nda = await db.trustNDAAgreement.findFirst({
      where: { accessRequestId: created.body.id },
    });
    expect(nda).toBeNull();

    // an active grant exists
    const grant = await db.trustAccessGrant.findFirst({
      where: { subjectEmail: INSIDER.email, status: 'active' },
    });
    expect(grant).toBeTruthy();

    // access email captured, with a working access link
    const mail = newEmails().find(
      (e) => e.to === INSIDER.email && /Access Granted/i.test(e.subject),
    );
    expect(mail).toBeTruthy();
    const link = mail!.links.find((l) => /\/access\//.test(l))!;
    const token = link.split('/access/')[1].split(/[?#]/)[0];
    const check = await api(`access/${token}`);
    expect(check.status).toBe(200);
    expect(check.body.subjectEmail).toBe(INSIDER.email);
  });
});
