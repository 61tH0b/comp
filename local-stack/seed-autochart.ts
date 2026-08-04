/**
 * Local seed for the Autochart.ai trust center.
 * Creates the "Aya Health Technologies" organization + a published Trust record
 * with frameworks, overview, FAQs, vendors, and custom links so the public
 * trust-access endpoints (and apps/trust-center) return real data locally.
 *
 * Run: cd packages/db && bunx prisma generate  (once)
 *      DATABASE_URL=... bun local-stack/seed-autochart.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const FRIENDLY_URL = 'autochart';
const ORG_NAME = 'Aya Health Technologies';

const FAQS = [
  { id: 'faq-1', order: 0, question: 'Where is Autochart.ai data stored?', answer: 'All data is stored in Canadian data centers, compliant with PIPEDA and provincial privacy laws.' },
  { id: 'faq-2', order: 1, question: 'Is Autochart.ai SOC 2 certified?', answer: 'Yes, Autochart.ai maintains SOC 2 Type II certification. You can request access to download the full report.' },
  { id: 'faq-3', order: 2, question: 'How does Autochart.ai handle voice recordings?', answer: 'Voice recordings are encrypted in transit and at rest, transcribed in real-time, and permanently deleted after transcription completes.' },
  { id: 'faq-4', order: 3, question: 'Does Autochart.ai sign BAAs?', answer: 'Yes, we execute Business Associate Agreements with all healthcare partners as required by HIPAA.' },
  { id: 'faq-5', order: 4, question: 'How can I report a security concern?', answer: 'Contact security@autochart.ai or use our responsible disclosure program.' },
  { id: 'faq-6', order: 5, question: 'What Canadian privacy laws does Autochart.ai comply with?', answer: 'We comply with PIPEDA (federal), PHIPA (Ontario), Alberta PIPA, BC PIPA, Manitoba PHIA, NB PHIPAA, NL PHIA, NS PHIA, and Quebec Law 25.' },
];

const OVERVIEW = `Autochart.ai, a product of Aya Health Technologies, is an AI-powered clinical documentation tool trusted by healthcare providers across North America. We are committed to maintaining the highest standards of data security and privacy compliance.

Our commitments:
- SOC 2 Type II certified
- HIPAA compliant for all protected health information
- PIPEDA and PHIPA compliant for Canadian privacy laws
- GDPR compliant for EU data protection
- Encryption: AES-256 at rest, TLS 1.2+ in transit
- Zero Trust Architecture with RBAC and MFA
- Regular penetration testing by Mirai Security
- Data hosted in Canadian data centers`;

const VENDORS = [
  { name: 'Microsoft Azure', description: 'Cloud infrastructure & hosting', website: 'https://azure.microsoft.com', badges: ['soc2', 'iso27001', 'hipaa'] },
  { name: 'Mirai Security', description: 'Penetration testing & security assessments', website: 'https://miraisecurity.com', badges: ['soc2'] },
  { name: 'OpenAI', description: 'AI model provider', website: 'https://openai.com', badges: ['soc2'] },
  { name: 'Resend', description: 'Transactional email', website: 'https://resend.com', badges: ['soc2'] },
];

const LINKS = [
  { order: 0, title: 'Privacy Policy', description: 'Autochart.ai privacy policy', url: 'https://autochart.ai/privacy' },
  { order: 1, title: 'Terms of Service', description: 'Terms and conditions', url: 'https://autochart.ai/terms' },
  { order: 2, title: 'Security', description: 'Security practices overview', url: 'https://autochart.ai/security' },
  { order: 3, title: 'Status Page', description: 'System uptime and incidents', url: 'https://status.autochart.ai' },
  { order: 4, title: 'Contact Support', description: 'Support and inquiries', url: 'https://autochart.ai/contact' },
];

async function main() {
  // 1. Organization (reuse if exists)
  let org = await db.organization.findFirst({ where: { name: ORG_NAME } });
  if (!org) {
    org = await db.organization.create({
      data: { name: ORG_NAME, website: 'https://autochart.ai', hasAccess: true },
    });
  }
  await db.organization.update({
    where: { id: org.id },
    data: { trustPortalFaqs: FAQS as any },
  });
  console.log(`Organization: ${org.id} (${org.name})`);

  // 2. Trust record (composite PK: status + organizationId)
  await db.trust.upsert({
    where: { organizationId: org.id },
    update: {
      friendlyUrl: FRIENDLY_URL,
      status: 'published',
      contactEmail: 'security@autochart.ai',
      allowedDomains: ['autochart.ai', 'ayahealth.com'],
      showOverview: true,
      overviewTitle: 'Security & Compliance',
      overviewContent: OVERVIEW,
      soc2type2: true, soc2type2_status: 'compliant',
      hipaa: true, hipaa_status: 'compliant',
      gdpr: true, gdpr_status: 'compliant',
      pipeda: true, pipeda_status: 'compliant',
      phipa: true, phipa_status: 'compliant',
    },
    create: {
      organizationId: org.id,
      friendlyUrl: FRIENDLY_URL,
      status: 'published',
      contactEmail: 'security@autochart.ai',
      allowedDomains: ['autochart.ai', 'ayahealth.com'],
      showOverview: true,
      overviewTitle: 'Security & Compliance',
      overviewContent: OVERVIEW,
      soc2type2: true, soc2type2_status: 'compliant',
      hipaa: true, hipaa_status: 'compliant',
      gdpr: true, gdpr_status: 'compliant',
      pipeda: true, pipeda_status: 'compliant',
      phipa: true, phipa_status: 'compliant',
    },
  });
  console.log(`Trust record published at friendlyUrl="${FRIENDLY_URL}"`);

  // 3. Vendors (reset + recreate)
  await db.vendor.deleteMany({ where: { organizationId: org.id, name: { in: VENDORS.map((v) => v.name) } } });
  for (const v of VENDORS) {
    await db.vendor.create({
      data: {
        organizationId: org.id,
        name: v.name,
        description: v.description,
        website: v.website,
        showOnTrustPortal: true,
        trustPortalOrder: VENDORS.indexOf(v),
        complianceBadges: v.badges.map((b) => ({ type: b, verified: true })) as any,
      },
    });
  }
  console.log(`Vendors: ${VENDORS.length}`);

  // 4. Custom links (reset + recreate)
  await db.trustCustomLink.deleteMany({ where: { organizationId: org.id } });
  for (const l of LINKS) {
    await db.trustCustomLink.create({
      data: { organizationId: org.id, title: l.title, description: l.description, url: l.url, order: l.order, isActive: true },
    });
  }
  console.log(`Custom links: ${LINKS.length}`);

  // 5. Owner user + member (needed to approve access requests locally)
  let user = await db.user.findFirst({ where: { email: 'owner@autochart.ai' } });
  if (!user) {
    user = await db.user.create({
      data: { name: 'Autochart Admin', email: 'owner@autochart.ai', emailVerified: true },
    });
  }
  let member = await db.member.findFirst({ where: { organizationId: org.id, userId: user.id } });
  if (!member) {
    member = await db.member.create({
      data: { organizationId: org.id, userId: user.id, role: 'owner' },
    });
  }
  console.log(`Owner member: ${member.id} (user ${user.email})`);

  // 6. Sample gated content: a published policy + a trust document backed by a
  // real PDF object in MinIO, so the access portal tabs have data and the
  // signed-URL download path is exercisable.
  const policyName = 'Information Security Policy';
  const existingPolicy = await db.policy.findFirst({
    where: { organizationId: org.id, name: policyName },
  });
  if (!existingPolicy) {
    await db.policy.create({
      data: {
        organizationId: org.id,
        name: policyName,
        description: 'How Aya Health Technologies protects systems and data.',
        status: 'published',
        isArchived: false,
        lastPublishedAt: new Date(),
      },
    });
  }
  console.log(`Policy: ${policyName} (published)`);

  const s3Key = `${org.id}/trust-documents/security-whitepaper.pdf`;
  const MINIMAL_PDF = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n' +
      '4 0 obj<</Length 62>>stream\nBT /F1 24 Tf 72 720 Td (Autochart Security Whitepaper) Tj ET\nendstream endobj\n' +
      'trailer<</Root 1 0 R>>\n%%EOF\n',
  );
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: process.env.APP_AWS_REGION || 'us-east-1',
    endpoint: process.env.APP_AWS_ENDPOINT || 'http://127.0.0.1:9000',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || 'compai',
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || 'compai12345',
    },
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.APP_AWS_ORG_ASSETS_BUCKET || 'compai-assets',
      Key: s3Key,
      Body: MINIMAL_PDF,
      ContentType: 'application/pdf',
    }),
  );
  const docName = 'Security Whitepaper.pdf';
  const existingDoc = await db.trustDocument.findFirst({
    where: { organizationId: org.id, name: docName },
  });
  if (!existingDoc) {
    await db.trustDocument.create({
      data: {
        organizationId: org.id,
        name: docName,
        description: 'High-level security architecture overview',
        s3Key,
        category: 'general',
        isActive: true,
      },
    });
  }
  console.log(`Trust document: ${docName} -> s3://compai-assets/${s3Key}`);

  console.log('\nDone. Trust center data seeded for /autochart');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
