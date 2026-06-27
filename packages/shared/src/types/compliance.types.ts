export enum ComplianceStatus {
  UNKNOWN = 'UNKNOWN',
  COMPLIANT = 'COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  IN_PROGRESS = 'IN_PROGRESS',
  EXPIRED = 'EXPIRED',
}

export interface ComplianceFramework {
  id: string;
  code: string;
  name: string;
  description: string | null;
  version: string | null;
  category: string | null;
  isActive: boolean;
}

export interface VendorCompliance {
  id: string;
  tenantId: string;
  vendorId: string;
  frameworkId: string;
  status: ComplianceStatus;
  certificationDate: Date | null;
  expirationDate: Date | null;
  evidenceArtifactId: string | null;
  notes: string | null;
  aiDiscovered: boolean;
  aiConfidence: number | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
