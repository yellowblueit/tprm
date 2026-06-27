export enum AlertType {
  DATA_BREACH = 'DATA_BREACH',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  COMPLIANCE_CHANGE = 'COMPLIANCE_CHANGE',
  LEADERSHIP_CHANGE = 'LEADERSHIP_CHANGE',
  FINANCIAL_RISK = 'FINANCIAL_RISK',
  NEGATIVE_NEWS = 'NEGATIVE_NEWS',
  CERTIFICATE_EXPIRY = 'CERTIFICATE_EXPIRY',
  DOMAIN_SECURITY = 'DOMAIN_SECURITY',
  TECHNOLOGY_CHANGE = 'TECHNOLOGY_CHANGE',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum ReviewCycleStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  EVIDENCE_COLLECTION = 'EVIDENCE_COLLECTION',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export interface MonitoringAlert {
  id: string;
  tenantId: string;
  vendorId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  sourceUrl: string | null;
  sourceData: Record<string, unknown> | null;
  riskImpact: number | null;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  acknowledgedById: string | null;
  dismissed: boolean;
  detectedAt: Date;
  createdAt: Date;
}

export interface ReviewCycle {
  id: string;
  tenantId: string;
  vendorId: string;
  cycleNumber: number;
  status: ReviewCycleStatus;
  startDate: Date;
  dueDate: Date;
  completedDate: Date | null;
  inherentScoreSnapshot: number | null;
  residualScoreSnapshot: number | null;
  notes: string | null;
  triggeredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
