export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL',
}

export enum MaturityLevel {
  NOT_ASSESSED = 'NOT_ASSESSED',
  INITIAL = 'INITIAL',
  DEVELOPING = 'DEVELOPING',
  DEFINED = 'DEFINED',
  MANAGED = 'MANAGED',
  OPTIMIZING = 'OPTIMIZING',
}

export interface RiskScore {
  id: string;
  tenantId: string;
  vendorId: string;
  inherentRiskScore: number;
  inherentRiskLevel: RiskLevel;
  inherentBreakdown: InherentBreakdown;
  residualRiskScore: number | null;
  residualRiskLevel: RiskLevel | null;
  residualBreakdown: ResidualBreakdown | null;
  impactScore: number;
  likelihoodScore: number | null;
  isLatest: boolean;
  calculatedAt: Date;
  calculatedById: string | null;
}

export interface InherentBreakdown {
  dataClassificationScore: number;
  criticalityMultiplier: number;
  businessCaseLikelihoodScore: number;
  impactWeight: number;
  likelihoodWeight: number;
}

export interface ResidualBreakdown {
  domainScores: Record<string, number>;
  overallControlEffectiveness: number;
  gaps: string[];
}

export interface ScoringMatrixConfig {
  businessCaseWeights: Record<string, number>;
  criticalityWeights: Record<string, number>;
  riskLevelThresholds: Record<string, number>;
  domainWeights: Record<string, number>;
  maturityEffectiveness: Record<string, number>;
  impactWeight: number;
  likelihoodWeight: number;
}
