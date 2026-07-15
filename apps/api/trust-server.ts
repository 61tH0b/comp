/**
 * Scoped Trust Center backend for trust.autochart.ai.
 *
 * Boots ONLY the TrustPortalModule (public trust-access + admin trust-portal
 * endpoints) instead of the full Comp AI monolith. This is the correct
 * deployment scope for a dedicated trust center: the frontend in
 * apps/trust-center only consumes /v1/trust-access/* and /v1/trust-portal/*.
 *
 * Run: cd apps/api && bun trust-server.ts
 */
import './src/config/load-env';
import { Module, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TrustPortalModule } from './src/trust-portal/trust-portal.module';

// Root module: provide a global ConfigService (the monolith AppModule does this)
// and mount only the trust portal module.
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TrustPortalModule],
})
class TrustServerModule {}

async function main() {
  const app = await NestFactory.create(TrustServerModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableCors({ origin: true, credentials: true });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  const port = Number(process.env.PORT || 3333);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Trust Center API listening on http://localhost:${port}/v1`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start Trust Center API:', e);
  process.exit(1);
});
