import type { MaturityLevel } from './risk.types.js';

export interface DomainAssessment {
  id: string;
  tenantId: string;
  vendorId: string;
  domainId: string;
  maturityLevel: MaturityLevel;
  controlEffectiveness: number | null;
  gapDescription: string | null;
  findings: Record<string, unknown> | null;
  evidence: Record<string, unknown> | null;
  aiGenerated: boolean;
  aiConfidence: number | null;
  assessedAt: Date | null;
  assessedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityDomain {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  parentId: string | null;
}
