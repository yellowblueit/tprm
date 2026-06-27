export enum UserRole {
  MSP_ADMIN = 'MSP_ADMIN',
  MSP_USER = 'MSP_USER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER = 'TENANT_USER',
  VENDOR_USER = 'VENDOR_USER',
}

export interface User {
  id: string;
  tenantId: string;
  entraObjectId: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  tenantId: string;
  entraObjectId: string;
  email: string;
  displayName: string;
  role: UserRole;
}

// InviteUserInput is defined in utils/validation-schemas.ts via Zod
