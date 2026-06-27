export enum ArtifactType {
  SOC2_TYPE1 = 'SOC2_TYPE1',
  SOC2_TYPE2 = 'SOC2_TYPE2',
  ISO_27001 = 'ISO_27001',
  ISO_27701 = 'ISO_27701',
  PENTEST_REPORT = 'PENTEST_REPORT',
  VULNERABILITY_SCAN = 'VULNERABILITY_SCAN',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_PROCESSING_AGREEMENT = 'DATA_PROCESSING_AGREEMENT',
  BUSINESS_CONTINUITY_PLAN = 'BUSINESS_CONTINUITY_PLAN',
  INCIDENT_RESPONSE_PLAN = 'INCIDENT_RESPONSE_PLAN',
  SECURITY_POLICY = 'SECURITY_POLICY',
  VENDOR_QUESTIONNAIRE = 'VENDOR_QUESTIONNAIRE',
  CAIQ = 'CAIQ',
  SIG = 'SIG',
  HECVAT = 'HECVAT',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER',
}

export enum AiAnalysisStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ArtifactSource {
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  VENDOR_PORTAL_UPLOAD = 'VENDOR_PORTAL_UPLOAD',
  TRUST_CENTER = 'TRUST_CENTER',
  AI_DISCOVERED = 'AI_DISCOVERED',
}

export enum CoverageLevel {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}

export interface SecurityArtifact {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  type: ArtifactType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  objectKey: string;
  bucketName: string;
  validFrom: Date | null;
  validUntil: Date | null;
  isExpired: boolean;
  aiAnalysisStatus: AiAnalysisStatus;
  aiAnalysis: Record<string, unknown> | null;
  aiAnalyzedAt: Date | null;
  source: ArtifactSource;
  sourceUrl: string | null;
  uploadedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
