# Vanta → Comp AI Migration Plan for Autochart.ai (Aya Health Technologies)

## Executive Summary

This document outlines the comprehensive plan to migrate Autochart.ai's compliance management from **Vanta.com** to the **Comp AI** open-source compliance platform. Autochart.ai, a product of Aya Health Technologies, is an AI-powered clinical documentation tool that must maintain compliance with SOC 2 Type II, HIPAA, GDPR, PIPEDA, PHIPA, and multiple Canadian provincial privacy laws.

The migration strategy adds all 9 Canadian privacy frameworks via Framework Editor seed data with PIPEDA and PHIPA also added as first-class Trust Portal frameworks. A new `TrustDocumentCategory` system supports Alberta OIPC reports and custodian documents. Deployment remains on **AWS** (no Azure migration required).

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis](#2-gap-analysis)
3. [Phase 1: Canadian Privacy Frameworks via Framework Editor](#3-phase-1-canadian-privacy-frameworks-via-framework-editor)
4. [Phase 2: Trust Portal Enhancements for Canadian Frameworks](#4-phase-2-trust-portal-enhancements-for-canadian-frameworks)
5. [Phase 3: Vanta Data Migration](#5-phase-3-vanta-data-migration)
6. [Phase 4: Trust Portal Domain Migration](#6-phase-4-trust-portal-domain-migration)
7. [Phase 5: Healthcare-Specific Enhancements](#7-phase-5-healthcare-specific-enhancements)
8. [Phase 6: Azure Deployment Adaptation](#8-phase-6-azure-deployment-adaptation)
9. [File-by-File Change List](#9-file-by-file-change-list)
10. [Risk Assessment & Rollback Strategy](#10-risk-assessment--rollback-strategy)

---

## 1. Current State Analysis

### 1.1 Autochart.ai Compliance Requirements (from Vanta)

| Framework | Jurisdiction | Status | Notes |
|-----------|-------------|--------|-------|
| **SOC 2 Type II** | International | Compliant | Achieved Sept 2025 |
| **HIPAA** | United States | Compliant | Healthcare data protection |
| **GDPR** | European Union | Compliant | EU data protection |
| **PIPEDA** | Canada (Federal) | Compliant | Personal Information Protection |
| **PHIPA** | Ontario, Canada | Compliant | Personal Health Information Protection |
| **Alberta PIPA** | Alberta, Canada | Compliant | Personal Information Protection |
| **BC PIPA** | British Columbia, Canada | Compliant | Personal Information Protection |
| **Manitoba PHIA & FIPPA** | Manitoba, Canada | Compliant | Personal Health Information |
| **New Brunswick PHIPAA** | New Brunswick, Canada | Compliant | Personal Health Information Privacy |
| **Newfoundland PHIA** | Newfoundland, Canada | Compliant | Personal Health Information |
| **Nova Scotia PHIA** | Nova Scotia, Canada | Compliant | Personal Health Information |
| **Quebec Law 25** | Quebec, Canada | Compliant | Privacy modernization law |

### 1.2 Autochart.ai Security Posture

- **Encryption**: AES-256 at rest, TLS 1.2+ in transit
- **Access Control**: OAuth 2.0, RBAC, MFA, Zero Trust Architecture
- **Monitoring**: SIEM tools for real-time threat detection
- **Assessments**: Regular pen testing, vulnerability scans, TRA, PIA
- **Hosting**: Microsoft Azure Canadian Data Centers (PIPEDA-compliant)
- **Security Partner**: Mirai Security (Canadian cybersecurity firm)

### 1.3 Comp AI Current Framework Support

| Framework | In Framework Editor | In Trust Portal | Status |
|-----------|-------------------|-----------------|--------|
| SOC 2 Type I | Yes | Yes | Full support |
| SOC 2 Type II | Yes | Yes | Full support |
| ISO 27001 | Yes | Yes | Full support |
| ISO 42001 | Yes | Yes | Full support |
| GDPR | Yes | Yes | Full support |
| HIPAA | Yes | Yes | Full support |
| PCI DSS | Yes | Yes | Full support |
| NEN 7510 | Yes | Yes | Full support |
| ISO 9001 | Yes | Yes | Full support |
| **PIPEDA** | **No** | **No** | **Needs addition** |
| **PHIPA** | **No** | **No** | **Needs addition** |
| **Provincial laws** | **No** | **No** | **Needs addition** |

---

## 2. Gap Analysis

### 2.1 Missing Frameworks (Critical)

The following frameworks are **not supported** in Comp AI and are **required** by Autochart.ai:

| Gap | Impact | Resolution |
|-----|--------|-----------|
| PIPEDA | Canadian federal compliance — **required** | Framework Editor + Trust Portal code changes |
| PHIPA | Ontario health data — **required** | Framework Editor + Trust Portal code changes |
| Alberta PIPA | Provincial compliance | Framework Editor (custom framework) |
| BC PIPA | Provincial compliance | Framework Editor (custom framework) |
| Manitoba PHIA | Provincial compliance | Framework Editor (custom framework) |
| New Brunswick PHIPAA | Provincial compliance | Framework Editor (custom framework) |
| Newfoundland PHIA | Provincial compliance | Framework Editor (custom framework) |
| Nova Scotia PHIA | Provincial compliance | Framework Editor (custom framework) |
| Quebec Law 25 | Provincial compliance | Framework Editor (custom framework) |

### 2.2 Trust Portal Gaps

| Gap | Description | Impact |
|-----|------------|--------|
| PIPEDA/PHIPA not in `TrustFramework` enum | Cannot show Canadian frameworks as compliance badges on trust portal | Must add to Prisma schema, API service, and UI |
| No Vanta data import | No tooling to import existing policies/evidence from Vanta exports | Must build migration scripts |
| Custom domain migration | `trust.autochart.ai` currently points to Vanta's infrastructure | Must reconfigure DNS to Comp AI's Vercel-based trust portal |

### 2.3 Deployment Gaps

| Gap | Description |
|-----|------------|
| AWS-centric deployment | Comp AI's `buildspec.yml` and `deploy.sh` target AWS ECS/ECR. Autochart uses Azure. |
| Azure Container support | Need Docker build configs for Azure Container Instances or Azure App Service |
| Azure Blob Storage | Comp AI uses AWS S3 for document storage. Need Azure Blob Storage adapter. |

---

## 3. Phase 1: Canadian Privacy Frameworks via Framework Editor

**Strategy**: Use the built-in Framework Editor to create custom frameworks for all Canadian privacy laws. This avoids code changes for framework definitions while providing full requirements/controls/policies/tasks structure.

### 3.1 PIPEDA Framework (Federal)

Create via Framework Editor UI or seed data with these requirements (based on PIPEDA's 10 Fair Information Principles):

**Framework Definition:**
```json
{
  "name": "PIPEDA",
  "description": "Personal Information Protection and Electronic Documents Act — Canadian federal privacy law governing how private-sector organizations collect, use, and disclose personal information in the course of commercial activities.",
  "version": "2024"
}
```

**Requirements (10 Fair Information Principles):**

| ID | Requirement | Description |
|----|------------|-------------|
| `pipeda-1` | Accountability | Organization is responsible for personal information under its control and shall designate a Privacy Officer |
| `pipeda-2` | Identifying Purposes | Purposes for which personal information is collected shall be identified before or at the time of collection |
| `pipeda-3` | Consent | Knowledge and consent of the individual are required for the collection, use, or disclosure of personal information |
| `pipeda-4` | Limiting Collection | Collection of personal information shall be limited to that which is necessary for the identified purposes |
| `pipeda-5` | Limiting Use, Disclosure, and Retention | Personal information shall not be used or disclosed for purposes other than those for which it was collected |
| `pipeda-6` | Accuracy | Personal information shall be as accurate, complete, and up-to-date as necessary for the purposes |
| `pipeda-7` | Safeguards | Personal information shall be protected by security safeguards appropriate to the sensitivity of the information |
| `pipeda-8` | Openness | Organization shall make readily available specific information about policies and practices relating to management of personal information |
| `pipeda-9` | Individual Access | Upon request, an individual shall be informed of the existence, use, and disclosure of their personal information and given access |
| `pipeda-10` | Challenging Compliance | An individual shall be able to address a challenge concerning compliance with the above principles to the designated individual(s) |

**Control Templates (mapped to Autochart.ai context):**

| Control | Maps to Principle | Autochart Implementation |
|---------|------------------|--------------------------|
| Privacy Officer Designation | Accountability | Designate DPO/CPO for Aya Health Technologies |
| Privacy Impact Assessment (PIA) | Accountability | Regular PIAs with Mirai Security |
| Purpose Specification Notices | Identifying Purposes | In-app consent notices before recording patient encounters |
| Consent Management System | Consent | Patient consent forms, provider opt-in flows |
| Data Minimization Controls | Limiting Collection | Voice recordings deleted immediately after transcription |
| Retention Policy Enforcement | Limiting Use/Retention | Automated data lifecycle management |
| Encryption at Rest & Transit | Safeguards | AES-256 + TLS 1.2+ |
| Access Control (RBAC/MFA) | Safeguards | Zero Trust Architecture enforcement |
| Privacy Policy Publication | Openness | Published at autochart.ai privacy page |
| Data Subject Access Request (DSAR) Process | Individual Access | DSAR workflow for patients/providers |
| Complaint Handling Process | Challenging Compliance | Documented complaint and escalation process |

### 3.2 PHIPA Framework (Ontario)

**Framework Definition:**
```json
{
  "name": "PHIPA",
  "description": "Personal Health Information Protection Act — Ontario's health privacy law governing the collection, use, and disclosure of personal health information by health information custodians.",
  "version": "2024"
}
```

**Key Requirements:**

| ID | Requirement | Description |
|----|------------|-------------|
| `phipa-1` | Health Information Custodian Obligations | Custodians must comply with PHIPA requirements for collection, use, disclosure, retention, and disposal of PHI |
| `phipa-2` | Consent for Collection | PHI collection requires consent unless an exception applies (e.g., providing healthcare) |
| `phipa-3` | Circle of Care | PHI may be shared within the "circle of care" for healthcare purposes with implied consent |
| `phipa-4` | Lockbox Provisions | Individuals can request that certain PHI be locked and not disclosed |
| `phipa-5` | Agent Requirements | Agents of custodians must comply with custodian's information practices |
| `phipa-6` | Electronic Health Records | Requirements for electronic audit logs, access controls, and breach notification for EHR systems |
| `phipa-7` | Breach Notification | Mandatory notification to IPC Ontario and affected individuals for privacy breaches |
| `phipa-8` | Privacy Impact Assessments | Required before implementing new information systems or practices |
| `phipa-9` | Data Retention & Disposal | Minimum retention periods and secure disposal requirements |
| `phipa-10` | Complaint & Inquiry Process | Process for individuals to make complaints to IPC Ontario |

### 3.3 Provincial Framework Definitions

Each provincial framework should be created as a separate custom framework via the Framework Editor. Summary:

| Framework | Key Differentiator | Seed Priority |
|-----------|-------------------|---------------|
| **Alberta PIPA** | Covers private-sector organizations; "reasonable person" consent standard | High |
| **BC PIPA** | Similar to Alberta PIPA; applies to BC private-sector orgs | High |
| **Manitoba PHIA** | Health-specific; mandatory breach notification since 2013 | Medium |
| **Manitoba FIPPA** | Public body requirements; relevant if serving MB government health | Low |
| **New Brunswick PHIPAA** | Health-specific; custodian/trustee model | Medium |
| **Newfoundland PHIA** | Health-specific; similar structure to NB PHIPAA | Medium |
| **Nova Scotia PHIA** | Health-specific; custodian model | Medium |
| **Quebec Law 25** | Modernized privacy law; privacy officer mandatory, PIA required, consent requirements enhanced | High |

### 3.4 Seed Data Files to Create/Modify

Add entries to the following JSON files in `/packages/db/prisma/seed/primitives/`:

| File | Action | Content |
|------|--------|---------|
| `FrameworkEditorFramework.json` | Add entries | PIPEDA, PHIPA, AB PIPA, BC PIPA, MB PHIA, NB PHIPAA, NL PHIA, NS PHIA, QC Law 25 |
| `FrameworkEditorRequirement.json` | Add entries | Requirements for each framework (10+ per framework) |
| `FrameworkEditorControlTemplate.json` | Add entries | Control templates mapped to requirements |
| `FrameworkEditorPolicyTemplate.json` | Add entries | Policy templates (Privacy Policy, Breach Notification, DSAR, etc.) |
| `FrameworkEditorTaskTemplate.json` | Add entries | Implementation tasks for each control |

---

## 4. Phase 2: Trust Portal Enhancements for Canadian Frameworks

The Trust Portal currently has a **hardcoded list of 9 frameworks** in the Prisma schema, API service, and UI. To display PIPEDA and PHIPA as first-class compliance badges on the trust portal (matching what Vanta shows at `trust.autochart.ai`), we need code changes.

### 4.1 Prisma Schema Changes

**File: `packages/db/prisma/schema/trust.prisma`**

Add to `TrustFramework` enum:
```prisma
enum TrustFramework {
  iso_27001
  iso_42001
  gdpr
  hipaa
  soc2_type1
  soc2_type2
  pci_dss
  nen_7510
  iso_9001
  pipeda        // NEW
  phipa         // NEW
}
```

Add to `Trust` model:
```prisma
model Trust {
  // ... existing fields ...
  pipeda          Boolean @default(false)
  phipa           Boolean @default(false)
  pipeda_status   FrameworkStatus @default(started)
  phipa_status    FrameworkStatus @default(started)
}
```

### 4.2 Database Migration

**Create: `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_canadian_privacy_frameworks/migration.sql`**

```sql
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
```

### 4.3 Trust Portal API Service

**File: `apps/api/src/trust-portal/trust-portal.service.ts`**

Add to `FRAMEWORK_CONFIG` static mapping:

```typescript
private static readonly FRAMEWORK_CONFIG: Record<
  TrustFramework,
  {
    statusField: /* ... existing union ... */ | 'pipeda_status' | 'phipa_status';
    enabledField: /* ... existing union ... */ | 'pipeda' | 'phipa';
    slug: string;
  }
> = {
  // ... existing entries ...
  [TrustFramework.pipeda]: {
    statusField: 'pipeda_status',
    enabledField: 'pipeda',
    slug: 'pipeda',
  },
  [TrustFramework.phipa]: {
    statusField: 'phipa_status',
    enabledField: 'phipa',
    slug: 'phipa',
  },
};
```

### 4.4 Trust Portal UI Components

**File: `apps/app/src/app/(app)/[orgId]/trust/portal-settings/components/TrustPortalSwitch.tsx`**

Changes needed:
1. Add `pipeda` and `phipa` to `trustPortalFormSchema`
2. Add `pipeda` and `phipa` to `FRAMEWORK_KEY_TO_API_SLUG`
3. Add props for `pipeda`, `pipedaStatus`, `phipa`, `phipaStatus`, `pipedaFileName`, `phipaFileName`
4. Add `<ComplianceFramework>` cards for PIPEDA and PHIPA
5. Add certificate file state for `pipeda` and `phipa`

**File: `apps/app/src/app/(app)/[orgId]/trust/portal-settings/components/logos.tsx`**

Add SVG logo components:
- `PIPEDA` — Canadian flag shield / privacy icon
- `PHIPA` — Ontario health privacy icon

### 4.5 Trust Portal Actions

**File: `apps/app/src/app/(app)/[orgId]/trust/portal-settings/actions/update-trust-portal-frameworks.ts`**

Add to `UpdateTrustPortalFrameworksParams`:
```typescript
interface UpdateTrustPortalFrameworksParams {
  // ... existing ...
  pipeda?: boolean;
  phipa?: boolean;
  pipedaStatus?: 'started' | 'in_progress' | 'compliant';
  phipaStatus?: 'started' | 'in_progress' | 'compliant';
}
```

Add to `updateTrustPortalFrameworks` function's `db.trust.update` data:
```typescript
pipeda: pipeda ?? trustPortal.pipeda,
phipa: phipa ?? trustPortal.phipa,
pipeda_status: pipedaStatus ?? trustPortal.pipeda_status,
phipa_status: phipaStatus ?? trustPortal.phipa_status,
```

### 4.6 Trust Portal Settings Page

**File: `apps/app/src/app/(app)/[orgId]/trust/portal-settings/page.tsx`**

Pass new props to `<TrustPortalSwitch>`:
```typescript
pipeda={trust.pipeda}
phipa={trust.phipa}
pipedaStatus={trust.pipeda_status}
phipaStatus={trust.phipa_status}
pipedaFileName={resourceFiles.pipeda}
phipaFileName={resourceFiles.phipa}
```

### 4.7 Public Trust Portal Display

**Files in `apps/portal/` (or equivalent public trust portal rendering):**

Ensure the public-facing trust portal displays PIPEDA and PHIPA badges alongside existing frameworks when enabled. Check for:
- Badge rendering component
- Framework list rendering
- Compliance certificate download for PIPEDA/PHIPA

### 4.8 ComplianceBadge Type Update

**File: `apps/app/src/app/(app)/[orgId]/trust/portal-settings/components/TrustPortalSwitch.tsx`**

Update `ComplianceBadge` type:
```typescript
type ComplianceBadge = {
  type: 'soc2' | 'iso27001' | 'iso42001' | 'gdpr' | 'hipaa' | 'pci_dss' | 'nen7510' | 'iso9001' | 'pipeda' | 'phipa';
  verified: boolean;
};
```

---

## 5. Phase 3: Vanta Data Migration

### 5.1 Vanta Export Strategy

Vanta provides data export capabilities. The following data needs to be migrated:

| Data Type | Vanta Source | Comp AI Target | Migration Method |
|-----------|-------------|----------------|-----------------|
| **Policies** | Vanta Policy documents | `Policy` table + S3 | Script: parse Vanta export → create Policy records |
| **Controls** | Vanta Controls list | `Control` table | Script: map Vanta control IDs → Comp AI control templates |
| **Evidence** | Vanta evidence artifacts | `EvidenceSubmission` table + S3 | Script: download from Vanta → upload to Comp AI S3 |
| **Tests/Checks** | Vanta automated tests | Integration Platform tests | Manual mapping: configure equivalent integrations |
| **Vendors** | Vanta vendor list | `Vendor` table | Script: import vendor data with risk assessments |
| **Personnel** | Vanta team members | `Member` table | Script: import via organization invite flow |
| **Audit Logs** | Vanta audit trail | N/A (start fresh) | Document: export Vanta audit logs for records |
| **Documents** | Vanta uploaded docs | `TrustDocument` table + S3 | Script: bulk upload to Comp AI |
| **Trust Portal Content** | trust.autochart.ai | Trust portal settings | Manual: recreate overview, FAQ, links, branding |

### 5.2 Migration Scripts to Create

**New directory: `scripts/migrations/vanta-import/`**

| Script | Purpose |
|--------|---------|
| `import-policies.ts` | Parse Vanta policy export CSV/JSON → create Policy records in Comp AI |
| `import-controls.ts` | Map Vanta controls to Comp AI framework control templates |
| `import-evidence.ts` | Download evidence files → upload to S3 → create EvidenceSubmission records |
| `import-vendors.ts` | Import vendor list with risk scores and compliance badges |
| `import-documents.ts` | Bulk upload compliance documents to Trust portal |
| `import-trust-content.ts` | Import trust portal overview, FAQ, custom links |
| `validate-migration.ts` | Post-migration validation: compare record counts, verify S3 uploads |

### 5.3 Control Mapping Guide

Map Vanta's control structure to Comp AI's framework-requirement-control hierarchy:

```
Vanta Control Category → Comp AI Framework Requirement
Vanta Control          → Comp AI Control (linked to requirement)
Vanta Test             → Comp AI Task (linked to control)
Vanta Evidence         → Comp AI Evidence Submission (linked to task)
```

Key mapping for Autochart.ai's SOC 2:
- Vanta "Access Control" → Comp AI SOC 2 CC6.x requirements
- Vanta "Change Management" → Comp AI SOC 2 CC8.x requirements
- Vanta "Risk Assessment" → Comp AI SOC 2 CC3.x requirements
- Vanta "Incident Response" → Comp AI SOC 2 CC7.x requirements
- Vanta "Vendor Management" → Comp AI SOC 2 CC9.x requirements

### 5.4 Compliance Certificate Migration

Upload existing compliance certificates to Comp AI trust portal:
- SOC 2 Type II report (PDF) → Trust Portal SOC 2 Type II certificate
- HIPAA attestation → Trust Portal HIPAA certificate
- PIPEDA compliance documentation → Trust Portal PIPEDA certificate (after Phase 2)
- PHIPA compliance documentation → Trust Portal PHIPA certificate (after Phase 2)

---

## 6. Phase 4: Trust Portal Domain Migration

### 6.1 Current State
- `trust.autochart.ai` → Points to Vanta's trust portal infrastructure
- DNS: CNAME record pointing to Vanta's servers

### 6.2 Migration Steps

1. **Set up Comp AI trust portal** with Autochart.ai branding:
   - Organization name: "Aya Health Technologies" / "Autochart.ai"
   - Upload favicon (Autochart.ai logo)
   - Set primary brand color
   - Configure overview content (mission statement, security commitment)
   - Add FAQ entries
   - Add custom links (privacy policy, support, etc.)
   - Configure vendor display (Azure, Mirai Security, etc.)

2. **Configure custom domain** in Comp AI:
   - Set `domain` field on Trust record to `trust.autochart.ai`
   - Comp AI will register the domain with Vercel via API
   - Get CNAME verification details from Vercel

3. **DNS cutover** (requires coordination):
   - Remove existing CNAME pointing to Vanta
   - Add new CNAME pointing to Comp AI's Vercel deployment: `cname.vercel-dns.com`
   - Add TXT verification record if required by Vercel
   - Wait for DNS propagation (typically 1-24 hours)

4. **Verify domain** in Comp AI:
   - Comp AI's `TrustPortalService.getDomainStatus()` will verify via Vercel API
   - Mark `domainVerified: true` once confirmed

5. **NDA Configuration** (if applicable):
   - Upload NDA PDF template to S3
   - Configure `TrustNDAAgreement` settings
   - Set allowed domains for bypass (e.g., `@autochart.ai`, `@ayahealth.com`)

### 6.3 Rollback Plan
- Keep Vanta trust portal active during transition
- Use a staging subdomain (e.g., `trust-staging.autochart.ai`) for testing
- Only cut over production DNS after full verification

---

## 7. Phase 5: Healthcare-Specific Enhancements

### 7.1 Healthcare AI Compliance Controls

Autochart.ai as a healthcare AI product has unique compliance needs. Consider these enhancements:

| Enhancement | Description | Priority |
|------------|-------------|----------|
| **Voice Recording Deletion Verification** | Evidence control verifying that voice recordings are deleted post-transcription | High |
| **BAA (Business Associate Agreement) Management** | Track BAAs with healthcare partners (HIPAA requirement) | High |
| **PHI Access Logging** | Enhanced audit logging for personal health information access | Medium |
| **Data Residency Controls** | Verify Azure data center location compliance (Canada, US, EU) | Medium |
| **AI Model Governance** | Controls for AI model training data isolation (ISO 42001 alignment) | Medium |
| **Clinical Data Classification** | Data classification scheme for healthcare data types | Low |

### 7.2 Integration Opportunities

Leverage Comp AI's integration platform for Autochart.ai's stack:

| Integration | Purpose | Implementation |
|------------|---------|---------------|
| **Azure AD** | SSO + user provisioning | Already partially supported (OAuth) |
| **Azure Security Center** | Cloud security posture monitoring | New integration manifest needed |
| **Microsoft Intune** | Device compliance (endpoint management) | New integration manifest |
| **Azure Monitor / Log Analytics** | SIEM integration for evidence collection | New integration manifest |

### 7.3 Suggested Policy Templates

Create healthcare-specific policy templates in the Framework Editor:

| Policy | Framework | Description |
|--------|-----------|-------------|
| Patient Data Privacy Policy | PHIPA, PIPEDA | How Autochart handles patient health information |
| Voice Recording Handling Policy | HIPAA, PHIPA | Lifecycle of voice recordings (capture → transcribe → delete) |
| Breach Notification Procedure | All | Province-specific breach notification timelines and procedures |
| Data Residency Policy | PIPEDA | Where data is stored and why (Azure Canada data centers) |
| AI Ethics & Governance Policy | ISO 42001 | How AI models are trained, tested, and monitored |
| Third-Party Risk Management Policy | SOC 2, PIPEDA | Vendor assessment procedures (Mirai Security, Azure, etc.) |
| Consent Management Policy | PIPEDA, PHIPA, GDPR | How patient and provider consent is collected and managed |

---

## 8. Phase 6: Azure Deployment Adaptation

### 8.1 Current Comp AI Deployment (AWS)

```
GitHub Actions → AWS CodeBuild → Docker Build → AWS ECR → AWS ECS (Fargate)
                                                           └── S3 (documents)
                                                           └── Trigger.dev (background jobs)
                                                           └── Vercel (frontend + trust portal)
```

### 8.2 Target Deployment (Azure)

```
Azure DevOps Pipelines → Docker Build → Azure Container Registry → Azure Container Apps
                                                                     └── Azure Blob Storage (documents)
                                                                     └── Trigger.dev (background jobs)
                                                                     └── Vercel (frontend + trust portal)
```

### 8.3 Required Changes

| Component | Current (AWS) | Target (Azure) | Changes Needed |
|-----------|--------------|----------------|----------------|
| **Container Registry** | AWS ECR | Azure Container Registry (ACR) | Update `buildspec.yml` to push to ACR |
| **Container Hosting** | AWS ECS Fargate | Azure Container Apps | New `azure-pipelines.yml` or Bicep templates |
| **Object Storage** | AWS S3 | Azure Blob Storage | New storage adapter in `apps/api/src/app/s3.ts` |
| **Database** | PostgreSQL (any) | Azure Database for PostgreSQL | Connection string change only |
| **Secrets** | AWS Secrets Manager | Azure Key Vault | Environment variable references |
| **CI/CD** | GitHub Actions + CodeBuild | Azure DevOps Pipelines (or keep GitHub Actions) | New pipeline definitions |
| **DNS/CDN** | Vercel | Vercel (keep) or Azure Front Door | Minimal change if keeping Vercel |

### 8.4 Storage Adapter Pattern

**File: `apps/api/src/app/storage.ts`** (new abstraction)

Create a storage abstraction layer that supports both AWS S3 and Azure Blob Storage:

```typescript
interface StorageAdapter {
  upload(key: string, data: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

// Implementations:
// - S3StorageAdapter (existing, extracted from trust-portal.service.ts)
// - AzureBlobStorageAdapter (new)
```

### 8.5 Azure DevOps Pipeline (for DevOps_Autochart_Web_App)

If the `DevOps_Autochart_Web_App` Azure DevOps project will host the CI/CD pipeline, create:

**File: `azure-pipelines.yml`** (new)
```yaml
trigger:
  branches:
    include:
      - main
      - release

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildAndPush
        steps:
          - task: Docker@2
            inputs:
              containerRegistry: 'AutochartACR'
              repository: 'compai-api'
              command: 'buildAndPush'
              Dockerfile: 'apps/api/Dockerfile'

  - stage: Migrate
    dependsOn: Build
    jobs:
      - job: DatabaseMigration
        steps:
          - script: bunx prisma migrate deploy
            env:
              DATABASE_URL: $(DATABASE_URL)

  - stage: Deploy
    dependsOn: Migrate
    jobs:
      - job: DeployContainerApp
        steps:
          - task: AzureContainerApps@1
            inputs:
              azureSubscription: 'AyaHealthProd'
              containerAppName: 'compai-api'
              resourceGroup: 'rg-autochart-prod'
```

---

## 9. File-by-File Change List

### 9.1 Database Schema & Migrations

| File | Action | Description |
|------|--------|-------------|
| `packages/db/prisma/schema/trust.prisma` | **Modify** | Add `pipeda`, `phipa` to `TrustFramework` enum; add boolean + status fields to `Trust` model |
| `packages/db/prisma/migrations/YYYYMMDDHHMMSS_add_canadian_privacy_frameworks/migration.sql` | **Create** | SQL migration for new enum values and Trust table columns |

### 9.2 Seed Data (Framework Editor)

| File | Action | Description |
|------|--------|-------------|
| `packages/db/prisma/seed/primitives/FrameworkEditorFramework.json` | **Modify** | Add PIPEDA, PHIPA, and provincial framework entries |
| `packages/db/prisma/seed/primitives/FrameworkEditorRequirement.json` | **Modify** | Add requirements for each new framework |
| `packages/db/prisma/seed/primitives/FrameworkEditorControlTemplate.json` | **Modify** | Add control templates for each new framework |
| `packages/db/prisma/seed/primitives/FrameworkEditorPolicyTemplate.json` | **Modify** | Add policy templates for healthcare/Canadian privacy |
| `packages/db/prisma/seed/primitives/FrameworkEditorTaskTemplate.json` | **Modify** | Add task templates for each control |

### 9.3 Trust Portal API

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/trust-portal/trust-portal.service.ts` | **Modify** | Add PIPEDA/PHIPA to `FRAMEWORK_CONFIG`; update type unions for statusField/enabledField |

### 9.4 Trust Portal UI

| File | Action | Description |
|------|--------|-------------|
| `apps/app/src/app/(app)/[orgId]/trust/portal-settings/components/TrustPortalSwitch.tsx` | **Modify** | Add PIPEDA/PHIPA to form schema, API slug mapping, component props, ComplianceFramework cards, certificate state |
| `apps/app/src/app/(app)/[orgId]/trust/portal-settings/components/logos.tsx` | **Modify** | Add PIPEDA and PHIPA SVG logo components |
| `apps/app/src/app/(app)/[orgId]/trust/portal-settings/actions/update-trust-portal-frameworks.ts` | **Modify** | Add pipeda/phipa params and db.trust.update fields |
| `apps/app/src/app/(app)/[orgId]/trust/portal-settings/page.tsx` | **Modify** | Pass pipeda/phipa props to TrustPortalSwitch |

### 9.5 Public Trust Portal (Portal App)

| File | Action | Description |
|------|--------|-------------|
| `apps/portal/` (framework badge renderer) | **Modify** | Ensure PIPEDA/PHIPA badges render on public trust portal |

### 9.6 Migration Scripts

| File | Action | Description |
|------|--------|-------------|
| `scripts/migrations/vanta-import/import-policies.ts` | **Create** | Import policies from Vanta export |
| `scripts/migrations/vanta-import/import-controls.ts` | **Create** | Map and import controls |
| `scripts/migrations/vanta-import/import-evidence.ts` | **Create** | Import evidence artifacts |
| `scripts/migrations/vanta-import/import-vendors.ts` | **Create** | Import vendor data |
| `scripts/migrations/vanta-import/import-documents.ts` | **Create** | Import trust portal documents |
| `scripts/migrations/vanta-import/import-trust-content.ts` | **Create** | Import trust portal content (overview, FAQ, links) |
| `scripts/migrations/vanta-import/validate-migration.ts` | **Create** | Validate migration completeness |

### 9.7 Azure Deployment (Optional — depends on deployment strategy)

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/app/storage.ts` | **Create** | Abstract storage adapter (S3 + Azure Blob) |
| `apps/api/src/app/s3.ts` | **Modify** | Refactor to use storage adapter pattern |
| `azure-pipelines.yml` | **Create** | Azure DevOps CI/CD pipeline |
| `infra/azure/` | **Create** | Bicep/ARM templates for Azure infrastructure |

---

## 10. Risk Assessment & Rollback Strategy

### 10.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Vanta data export incomplete | Medium | High | Verify export completeness before starting migration; maintain Vanta access for 90 days post-migration |
| DNS cutover causes downtime | Low | High | Use staging subdomain first; keep Vanta portal active during transition |
| Framework seed data errors | Medium | Medium | Test framework editor imports in staging environment first |
| Azure storage adapter bugs | Medium | Medium | Comprehensive integration tests; keep S3 as fallback |
| Missing compliance evidence | Low | High | Pre-migration audit: document all Vanta evidence and verify transfer |

### 10.2 Rollback Plan

1. **Phase 1-2 Rollback**: Revert database migration; Prisma will not break on extra enum values, but can drop columns if needed
2. **Phase 3 Rollback**: Migration scripts are idempotent; can re-run or delete imported records
3. **Phase 4 Rollback**: Revert DNS to point back to Vanta within minutes
4. **Phase 5-6 Rollback**: Feature flags for new integrations; revert to AWS if Azure deployment fails

### 10.3 Success Criteria

- [ ] All 12 compliance frameworks are available in Comp AI (SOC2, HIPAA, GDPR, PIPEDA, PHIPA + 7 provincial)
- [ ] Trust portal at `trust.autochart.ai` displays all active frameworks with badges
- [ ] All existing policies are migrated from Vanta with version history
- [ ] All compliance evidence is accessible in Comp AI
- [ ] NDA signing workflow works on trust portal
- [ ] Compliance certificates (SOC 2 report, etc.) are downloadable from trust portal
- [ ] Vendor list displays correctly on trust portal
- [ ] Zero compliance gaps between Vanta and Comp AI implementations

### 10.4 Timeline Recommendation

| Phase | Estimated Effort | Dependencies |
|-------|-----------------|--------------|
| Phase 1: Framework Editor Seed Data | 1-2 weeks | None |
| Phase 2: Trust Portal Code Changes | 1 week | Phase 1 |
| Phase 3: Vanta Data Migration | 1-2 weeks | Vanta export + Phases 1-2 |
| Phase 4: Domain Migration | 1-2 days | Phases 1-3 + DNS access |
| Phase 5: Healthcare Enhancements | 2-3 weeks | Phases 1-4 |
| Phase 6: Azure Deployment | 2-3 weeks | Can run in parallel with Phases 1-5 |

**Total estimated effort: 6-10 weeks**

---

## Appendix A: SharePoint Documentation Requirements

The following compliance documents should be sourced from the Aya Health Technologies SharePoint:

| Document | Purpose | Migration Target |
|----------|---------|-----------------|
| Privacy Impact Assessments (PIAs) | Evidence for PIPEDA/PHIPA compliance | Upload as Evidence Submissions |
| Threat Risk Assessments (TRAs) | Evidence for SOC 2 / security controls | Upload as Evidence Submissions |
| Mirai Security pen test reports | Evidence for SOC 2 CC7.x | Upload as Evidence Submissions |
| BAA agreements | HIPAA evidence | Upload as Trust Documents |
| Employee security training records | SOC 2 CC1.x evidence | Upload as Evidence Submissions |
| Incident response plans | SOC 2 CC7.x / PHIPA breach notification | Upload as Policies |
| Data flow diagrams | PIPEDA/PHIPA evidence | Upload as Trust Documents |
| Consent form templates | PIPEDA/PHIPA evidence | Upload as Trust Documents |
| Vendor risk assessments | SOC 2 CC9.x / PIPEDA | Import via vendor import script |

## Appendix B: Vanta-to-CompAI Terminology Mapping

| Vanta Term | Comp AI Term | Notes |
|-----------|-------------|-------|
| Tests | Tasks | Automated compliance checks |
| Controls | Controls | Direct mapping |
| Policies | Policies | Direct mapping |
| Evidence | Evidence Submissions | Files/artifacts proving compliance |
| People | Members | Organization team members |
| Vendors | Vendors | Third-party service providers |
| Trust Center | Trust Portal | Public compliance page |
| Monitors | Integration Tests | Automated security checks |
| Questionnaires | Security Questionnaires | Vendor assessment forms |
| Inventory | Assets/Devices | Tracked endpoints and resources |

## Appendix C: Framework Editor vs Trust Portal Framework Comparison

| Aspect | Framework Editor | Trust Portal |
|--------|-----------------|-------------|
| **Purpose** | Internal compliance management (requirements, controls, tasks, policies) | External-facing compliance badge display |
| **Adding new framework** | No code changes (JSON seed data or UI) | Requires code changes (Prisma schema, API, UI) |
| **Recommended for** | All 12 Autochart.ai frameworks | PIPEDA + PHIPA (most visible to customers) |
| **Provincial frameworks** | Use Framework Editor only | Do NOT add to Trust Portal (too many badges) |
