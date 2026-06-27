export enum TenantType {
  MSP = 'MSP',
  CLIENT = 'CLIENT',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  parentTenantId: string | null;
  isActive: boolean;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// CreateTenantInput and UpdateTenantInput are defined in utils/validation-schemas.ts via Zod
