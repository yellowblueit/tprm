-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('MSP', 'CLIENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MSP_ADMIN', 'MSP_USER', 'TENANT_ADMIN', 'TENANT_USER', 'VENDOR_USER');

-- CreateEnum
CREATE TYPE "VendorStage" AS ENUM ('EVALUATING', 'SCREENING', 'ONBOARDED', 'OFFBOARDING', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "VendorCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BusinessCaseEnum" AS ENUM ('AI_SYSTEMS', 'NETWORK_INTEGRATION', 'ONSITE_PHYSICAL_ACCESS', 'PERSONAL_DATA_PRIVACY', 'TECHNOLOGY_PROVIDER', 'THIRD_PARTY_DATA_HOSTING', 'VENDOR_DATA_PROCESSING', 'VENDOR_LOGICAL_ACCESS');

-- CreateEnum
CREATE TYPE "DataCategory" AS ENUM ('COMPANY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SensitivityLevel" AS ENUM ('EXTREME', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SOC2_TYPE1', 'SOC2_TYPE2', 'ISO_27001', 'ISO_27701', 'PENTEST_REPORT', 'VULNERABILITY_SCAN', 'INSURANCE_CERTIFICATE', 'PRIVACY_POLICY', 'DATA_PROCESSING_AGREEMENT', 'BUSINESS_CONTINUITY_PLAN', 'INCIDENT_RESPONSE_PLAN', 'SECURITY_POLICY', 'VENDOR_QUESTIONNAIRE', 'CAIQ', 'SIG', 'HECVAT', 'CUSTOM', 'OTHER');

-- CreateEnum
CREATE TYPE "AiAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ArtifactSource" AS ENUM ('MANUAL_UPLOAD', 'VENDOR_PORTAL_UPLOAD', 'TRUST_CENTER', 'AI_DISCOVERED');

-- CreateEnum
CREATE TYPE "CoverageLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "MaturityLevel" AS ENUM ('NOT_ASSESSED', 'INITIAL', 'DEVELOPING', 'DEFINED', 'MANAGED', 'OPTIMIZING');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('UNKNOWN', 'COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'IN_PROGRESS', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RemediationPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_VENDOR', 'VENDOR_RESPONDED', 'UNDER_REVIEW', 'ACCEPTED', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('INTERNAL_USER', 'VENDOR_USER');

-- CreateEnum
CREATE TYPE "ReviewCycleStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'EVIDENCE_COLLECTION', 'UNDER_REVIEW', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DATA_BREACH', 'SECURITY_INCIDENT', 'COMPLIANCE_CHANGE', 'LEADERSHIP_CHANGE', 'FINANCIAL_RISK', 'NEGATIVE_NEWS', 'CERTIFICATE_EXPIRY', 'DOMAIN_SECURITY', 'TECHNOLOGY_CHANGE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TenantType" NOT NULL DEFAULT 'CLIENT',
    "parentTenantId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "entraObjectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "headquartersCountry" TEXT,
    "employeeCount" TEXT,
    "yearFounded" INTEGER,
    "logoUrl" TEXT,
    "stage" "VendorStage" NOT NULL DEFAULT 'EVALUATING',
    "criticality" "VendorCriticality" NOT NULL DEFAULT 'MEDIUM',
    "aiEnrichmentData" JSONB,
    "aiEnrichedAt" TIMESTAMP(3),
    "catalogVendorId" UUID,
    "nextReviewDate" TIMESTAMP(3),
    "lastReviewDate" TIMESTAMP(3),
    "reviewFrequencyMonths" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVendor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "logoUrl" TEXT,
    "globalEnrichment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogArtifact" (
    "id" UUID NOT NULL,
    "catalogVendorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "aiAnalysis" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOwner" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBusinessCase" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "businessCase" "BusinessCaseEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBusinessCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDataClassification" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "dataTypeId" UUID NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDataClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataType" (
    "id" UUID NOT NULL,
    "category" "DataCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "sensitivityLevel" "SensitivityLevel" NOT NULL,
    "weightPercentage" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityArtifact" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysisStatus" "AiAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "aiAnalysis" JSONB,
    "aiAnalyzedAt" TIMESTAMP(3),
    "source" "ArtifactSource" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "sourceUrl" TEXT,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactDomainCoverage" (
    "id" UUID NOT NULL,
    "artifactId" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "coverageLevel" "CoverageLevel" NOT NULL DEFAULT 'PARTIAL',
    "aiConfidence" DOUBLE PRECISION,

    CONSTRAINT "ArtifactDomainCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityDomain" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainAssessment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "maturityLevel" "MaturityLevel" NOT NULL DEFAULT 'NOT_ASSESSED',
    "controlEffectiveness" DOUBLE PRECISION,
    "gapDescription" TEXT,
    "findings" JSONB,
    "evidence" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "assessedAt" TIMESTAMP(3),
    "assessedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "inherentRiskScore" DOUBLE PRECISION NOT NULL,
    "inherentRiskLevel" "RiskLevel" NOT NULL,
    "inherentBreakdown" JSONB NOT NULL,
    "residualRiskScore" DOUBLE PRECISION,
    "residualRiskLevel" "RiskLevel",
    "residualBreakdown" JSONB,
    "impactScore" DOUBLE PRECISION NOT NULL,
    "likelihoodScore" DOUBLE PRECISION,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringMatrix" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFramework" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCompliance" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "frameworkId" UUID NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "certificationDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "evidenceArtifactId" UUID,
    "notes" TEXT,
    "aiDiscovered" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remediation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domainId" UUID,
    "priority" "RemediationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RemediationStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "vendorResponse" TEXT,
    "responseArtifactId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remediation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationComment" (
    "id" UUID NOT NULL,
    "remediationId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subprocessor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subprocessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSubprocessor" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "subprocessorId" UUID NOT NULL,
    "serviceProvided" TEXT,
    "dataShared" TEXT,
    "riskLevel" "RiskLevel",
    "aiDiscovered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSubprocessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "status" "ReviewCycleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "inherentScoreSnapshot" DOUBLE PRECISION,
    "residualScoreSnapshot" DOUBLE PRECISION,
    "notes" TEXT,
    "triggeredBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringAlert" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceData" JSONB,
    "riskImpact" DOUBLE PRECISION,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" UUID,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_parentTenantId_idx" ON "Tenant"("parentTenantId");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_entraObjectId_key" ON "User"("entraObjectId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_entraObjectId_idx" ON "User"("entraObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Vendor_tenantId_idx" ON "Vendor"("tenantId");

-- CreateIndex
CREATE INDEX "Vendor_tenantId_stage_idx" ON "Vendor"("tenantId", "stage");

-- CreateIndex
CREATE INDEX "Vendor_catalogVendorId_idx" ON "Vendor"("catalogVendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_tenantId_name_key" ON "Vendor"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogVendor_name_key" ON "CatalogVendor"("name");

-- CreateIndex
CREATE INDEX "CatalogArtifact_catalogVendorId_idx" ON "CatalogArtifact"("catalogVendorId");

-- CreateIndex
CREATE INDEX "VendorOwner_vendorId_idx" ON "VendorOwner"("vendorId");

-- CreateIndex
CREATE INDEX "VendorOwner_userId_idx" ON "VendorOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOwner_vendorId_userId_key" ON "VendorOwner"("vendorId", "userId");

-- CreateIndex
CREATE INDEX "VendorBusinessCase_vendorId_idx" ON "VendorBusinessCase"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBusinessCase_vendorId_businessCase_key" ON "VendorBusinessCase"("vendorId", "businessCase");

-- CreateIndex
CREATE INDEX "VendorDataClassification_vendorId_idx" ON "VendorDataClassification"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDataClassification_vendorId_dataTypeId_key" ON "VendorDataClassification"("vendorId", "dataTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DataType_category_name_key" ON "DataType"("category", "name");

-- CreateIndex
CREATE INDEX "SecurityArtifact_tenantId_idx" ON "SecurityArtifact"("tenantId");

-- CreateIndex
CREATE INDEX "SecurityArtifact_vendorId_idx" ON "SecurityArtifact"("vendorId");

-- CreateIndex
CREATE INDEX "SecurityArtifact_vendorId_type_idx" ON "SecurityArtifact"("vendorId", "type");

-- CreateIndex
CREATE INDEX "ArtifactDomainCoverage_artifactId_idx" ON "ArtifactDomainCoverage"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactDomainCoverage_artifactId_domainId_key" ON "ArtifactDomainCoverage"("artifactId", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityDomain_code_key" ON "SecurityDomain"("code");

-- CreateIndex
CREATE INDEX "DomainAssessment_tenantId_idx" ON "DomainAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "DomainAssessment_vendorId_idx" ON "DomainAssessment"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "DomainAssessment_vendorId_domainId_key" ON "DomainAssessment"("vendorId", "domainId");

-- CreateIndex
CREATE INDEX "RiskScore_tenantId_idx" ON "RiskScore"("tenantId");

-- CreateIndex
CREATE INDEX "RiskScore_vendorId_idx" ON "RiskScore"("vendorId");

-- CreateIndex
CREATE INDEX "RiskScore_vendorId_isLatest_idx" ON "RiskScore"("vendorId", "isLatest");

-- CreateIndex
CREATE INDEX "ScoringMatrix_tenantId_idx" ON "ScoringMatrix"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringMatrix_tenantId_name_key" ON "ScoringMatrix"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceFramework_code_key" ON "ComplianceFramework"("code");

-- CreateIndex
CREATE INDEX "VendorCompliance_tenantId_idx" ON "VendorCompliance"("tenantId");

-- CreateIndex
CREATE INDEX "VendorCompliance_vendorId_idx" ON "VendorCompliance"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCompliance_vendorId_frameworkId_key" ON "VendorCompliance"("vendorId", "frameworkId");

-- CreateIndex
CREATE INDEX "Remediation_tenantId_idx" ON "Remediation"("tenantId");

-- CreateIndex
CREATE INDEX "Remediation_vendorId_idx" ON "Remediation"("vendorId");

-- CreateIndex
CREATE INDEX "Remediation_vendorId_status_idx" ON "Remediation"("vendorId", "status");

-- CreateIndex
CREATE INDEX "RemediationComment_remediationId_idx" ON "RemediationComment"("remediationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subprocessor_name_key" ON "Subprocessor"("name");

-- CreateIndex
CREATE INDEX "VendorSubprocessor_tenantId_idx" ON "VendorSubprocessor"("tenantId");

-- CreateIndex
CREATE INDEX "VendorSubprocessor_vendorId_idx" ON "VendorSubprocessor"("vendorId");

-- CreateIndex
CREATE INDEX "VendorSubprocessor_subprocessorId_idx" ON "VendorSubprocessor"("subprocessorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSubprocessor_vendorId_subprocessorId_key" ON "VendorSubprocessor"("vendorId", "subprocessorId");

-- CreateIndex
CREATE INDEX "ReviewCycle_tenantId_idx" ON "ReviewCycle"("tenantId");

-- CreateIndex
CREATE INDEX "ReviewCycle_vendorId_idx" ON "ReviewCycle"("vendorId");

-- CreateIndex
CREATE INDEX "ReviewCycle_status_idx" ON "ReviewCycle"("status");

-- CreateIndex
CREATE INDEX "MonitoringAlert_tenantId_idx" ON "MonitoringAlert"("tenantId");

-- CreateIndex
CREATE INDEX "MonitoringAlert_vendorId_idx" ON "MonitoringAlert"("vendorId");

-- CreateIndex
CREATE INDEX "MonitoringAlert_vendorId_acknowledged_idx" ON "MonitoringAlert"("vendorId", "acknowledged");

-- CreateIndex
CREATE INDEX "MonitoringAlert_detectedAt_idx" ON "MonitoringAlert"("detectedAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityType_idx" ON "AuditLog"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_parentTenantId_fkey" FOREIGN KEY ("parentTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_catalogVendorId_fkey" FOREIGN KEY ("catalogVendorId") REFERENCES "CatalogVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogArtifact" ADD CONSTRAINT "CatalogArtifact_catalogVendorId_fkey" FOREIGN KEY ("catalogVendorId") REFERENCES "CatalogVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOwner" ADD CONSTRAINT "VendorOwner_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOwner" ADD CONSTRAINT "VendorOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBusinessCase" ADD CONSTRAINT "VendorBusinessCase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDataClassification" ADD CONSTRAINT "VendorDataClassification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDataClassification" ADD CONSTRAINT "VendorDataClassification_dataTypeId_fkey" FOREIGN KEY ("dataTypeId") REFERENCES "DataType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityArtifact" ADD CONSTRAINT "SecurityArtifact_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactDomainCoverage" ADD CONSTRAINT "ArtifactDomainCoverage_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "SecurityArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactDomainCoverage" ADD CONSTRAINT "ArtifactDomainCoverage_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SecurityDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityDomain" ADD CONSTRAINT "SecurityDomain_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SecurityDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainAssessment" ADD CONSTRAINT "DomainAssessment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainAssessment" ADD CONSTRAINT "DomainAssessment_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SecurityDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringMatrix" ADD CONSTRAINT "ScoringMatrix_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCompliance" ADD CONSTRAINT "VendorCompliance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCompliance" ADD CONSTRAINT "VendorCompliance_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SecurityDomain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remediation" ADD CONSTRAINT "Remediation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationComment" ADD CONSTRAINT "RemediationComment_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "Remediation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubprocessor" ADD CONSTRAINT "VendorSubprocessor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubprocessor" ADD CONSTRAINT "VendorSubprocessor_subprocessorId_fkey" FOREIGN KEY ("subprocessorId") REFERENCES "Subprocessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringAlert" ADD CONSTRAINT "MonitoringAlert_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
