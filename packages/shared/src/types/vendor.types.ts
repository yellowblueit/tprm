export enum VendorStage {
  EVALUATING = 'EVALUATING',
  SCREENING = 'SCREENING',
  ONBOARDED = 'ONBOARDED',
  OFFBOARDING = 'OFFBOARDING',
  OFFBOARDED = 'OFFBOARDED',
}

export enum VendorCriticality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum BusinessCaseType {
  AI_SYSTEMS = 'AI_SYSTEMS',
  NETWORK_INTEGRATION = 'NETWORK_INTEGRATION',
  ONSITE_PHYSICAL_ACCESS = 'ONSITE_PHYSICAL_ACCESS',
  PERSONAL_DATA_PRIVACY = 'PERSONAL_DATA_PRIVACY',
  TECHNOLOGY_PROVIDER = 'TECHNOLOGY_PROVIDER',
  THIRD_PARTY_DATA_HOSTING = 'THIRD_PARTY_DATA_HOSTING',
  VENDOR_DATA_PROCESSING = 'VENDOR_DATA_PROCESSING',
  VENDOR_LOGICAL_ACCESS = 'VENDOR_LOGICAL_ACCESS',
}

export enum DataCategory {
  COMPANY = 'COMPANY',
  CUSTOMER = 'CUSTOMER',
}

export enum SensitivityLevel {
  EXTREME = 'EXTREME',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  headquartersCountry: string | null;
  employeeCount: string | null;
  yearFounded: number | null;
  logoUrl: string | null;
  stage: VendorStage;
  criticality: VendorCriticality;
  aiEnrichmentData: Record<string, unknown> | null;
  aiEnrichedAt: Date | null;
  catalogVendorId: string | null;
  nextReviewDate: Date | null;
  lastReviewDate: Date | null;
  reviewFrequencyMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

// CreateVendorInput and UpdateVendorInput are defined in utils/validation-schemas.ts via Zod

export interface VendorOwner {
  id: string;
  vendorId: string;
  userId: string;
  isPrimary: boolean;
  assignedAt: Date;
}

export interface DataType {
  id: string;
  category: DataCategory;
  name: string;
  sensitivityLevel: SensitivityLevel;
  weightPercentage: number;
  sortOrder: number;
}
