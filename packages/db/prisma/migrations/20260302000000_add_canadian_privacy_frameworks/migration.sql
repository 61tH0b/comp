-- Add PIPEDA and PHIPA to TrustFramework enum
ALTER TYPE "public"."TrustFramework" ADD VALUE 'pipeda';
ALTER TYPE "public"."TrustFramework" ADD VALUE 'phipa';

-- Add PIPEDA fields to Trust table
ALTER TABLE "public"."Trust"
ADD COLUMN "pipeda" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pipeda_status" "public"."FrameworkStatus" NOT NULL DEFAULT 'started';

-- Add PHIPA fields to Trust table
ALTER TABLE "public"."Trust"
ADD COLUMN "phipa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "phipa_status" "public"."FrameworkStatus" NOT NULL DEFAULT 'started';

-- Add TrustDocumentCategory enum
CREATE TYPE "public"."TrustDocumentCategory" AS ENUM ('general', 'oipc_report', 'custodian_document', 'privacy_impact_assessment', 'threat_risk_assessment', 'penetration_test_report', 'compliance_certificate');

-- Add category field to TrustDocument table
ALTER TABLE "public"."TrustDocument"
ADD COLUMN "category" "public"."TrustDocumentCategory" NOT NULL DEFAULT 'general';

-- Add index on TrustDocument for category filtering
CREATE INDEX "TrustDocument_organizationId_category_idx" ON "public"."TrustDocument"("organizationId", "category");
