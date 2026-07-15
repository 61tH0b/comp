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

  console.log('\nDone. Trust center data seeded for /autochart');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
