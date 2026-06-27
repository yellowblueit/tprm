export enum RemediationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RemediationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_VENDOR = 'AWAITING_VENDOR',
  VENDOR_RESPONDED = 'VENDOR_RESPONDED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  CLOSED = 'CLOSED',
  OVERDUE = 'OVERDUE',
}

export enum CommentAuthorType {
  INTERNAL_USER = 'INTERNAL_USER',
  VENDOR_USER = 'VENDOR_USER',
}

export interface Remediation {
  id: string;
  tenantId: string;
  vendorId: string;
  title: string;
  description: string;
  domainId: string | null;
  priority: RemediationPriority;
  status: RemediationStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  vendorResponse: string | null;
  responseArtifactId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemediationComment {
  id: string;
  remediationId: string;
  authorId: string;
  authorType: CommentAuthorType;
  content: string;
  createdAt: Date;
}
