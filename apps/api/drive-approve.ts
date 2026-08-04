/**
 * Local NDA-flow driver: creates an access request and approves it (the one
 * step that requires an org member / admin auth), using the real
 * TrustAccessService. Email is captured to disk via MOCK_EMAIL=true.
 * Prints JSON: { requestId, signToken, ndaUrl }.
 *
 * Run: cd apps/api && bun drive-approve.ts "Name" "email@x.com" "Company" "Title"
 */
import './src/config/load-env';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { db } from '@trycompai/db';
import { TrustPortalModule } from './src/trust-portal/trust-portal.module';
import { TrustAccessService } from './src/trust-portal/trust-access.service';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TrustPortalModule] })
class DriverModule {}

async function main() {
  const [name, email, company, jobTitle] = [
    process.argv[2] || 'Dr. Dana Reviewer',
    process.argv[3] || 'dana@northwind-health.com',
    process.argv[4] || 'Northwind Health',
    process.argv[5] || 'Chief Information Security Officer',
  ];
  const slug = 'autochart';

  const app = await NestFactory.createApplicationContext(DriverModule, { logger: ['error'] });
  const svc = app.get(TrustAccessService);

  const org = await db.organization.findFirst({ where: { name: 'Aya Health Technologies' } });
  if (!org) throw new Error('Org not found — run seed-autochart.ts first');
  const member = await db.member.findFirst({ where: { organizationId: org.id, role: 'owner' } });
  if (!member) throw new Error('Owner member not found — run seed-autochart.ts first');

  const created: any = await svc.createAccessRequest(
    slug,
    { name, email, company, jobTitle, purpose: 'SOC 2 and HIPAA vendor due diligence' } as any,
    '127.0.0.1',
    'local-driver',
  );
  const requestId = created.id;

  await svc.approveRequest(org.id, requestId, { durationDays: 30 } as any, member.id);

  const nda = await db.trustNDAAgreement.findFirst({
    where: { accessRequestId: requestId },
    orderBy: { createdAt: 'desc' },
  });

  const out = {
    requestId,
    email,
    signToken: nda?.signToken,
    ndaUrl: `${process.env.TRUST_APP_URL}/nda/${nda?.signToken}`,
  };
  console.log('RESULT ' + JSON.stringify(out));
  await app.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
