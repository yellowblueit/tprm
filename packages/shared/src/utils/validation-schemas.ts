import { z } from 'zod';
import { BusinessCaseType, VendorCriticality, VendorStage } from '../types/vendor.types.js';
import { UserRole } from '../types/user.types.js';
import { RemediationPriority, RemediationStatus } from '../types/remediation.types.js';
import { ArtifactType } from '../types/artifact.types.js';
import { TenantType } from '../types/tenant.types.js';

// ===== Common schemas =====

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ===== Tenant schemas =====

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  type: z.nativeEnum(TenantType).default(TenantType.CLIENT),
  settings: z.record(z.unknown()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

// ===== User schemas =====

export const inviteUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  role: z.nativeEnum(UserRole),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// ===== Vendor schemas =====

export const createVendorSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  industry: z.string().max(255).optional(),
  headquartersCountry: z.string().max(100).optional(),
  employeeCount: z.string().max(50).optional(),
  yearFounded: z.number().int().min(1800).max(2100).optional(),
  criticality: z.nativeEnum(VendorCriticality).default(VendorCriticality.MEDIUM),
  businessCases: z.array(z.nativeEnum(BusinessCaseType)).min(1),
  dataClassificationIds: z.array(z.string().uuid()),
  reviewFrequencyMonths: z.number().int().min(1).max(60).default(12),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  industry: z.string().max(255).optional(),
  headquartersCountry: z.string().max(100).optional(),
  employeeCount: z.string().max(50).optional(),
  yearFounded: z.number().int().min(1800).max(2100).optional(),
  criticality: z.nativeEnum(VendorCriticality).optional(),
  reviewFrequencyMonths: z.number().int().min(1).max(60).optional(),
});

export const updateVendorStageSchema = z.object({
  stage: z.nativeEnum(VendorStage),
});

export const setBusinessCasesSchema = z.object({
  businessCases: z.array(z.nativeEnum(BusinessCaseType)),
});

export const setDataClassificationsSchema = z.object({
  dataClassificationIds: z.array(z.string().uuid()),
});

export const assignVendorOwnerSchema = z.object({
  userId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

// ===== Remediation schemas =====

export const createRemediationSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10000),
  domainId: z.string().uuid().optional(),
  priority: z.nativeEnum(RemediationPriority).default(RemediationPriority.MEDIUM),
  dueDate: z.string().datetime().optional(),
});

export const updateRemediationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(10000).optional(),
  priority: z.nativeEnum(RemediationPriority).optional(),
  status: z.nativeEnum(RemediationStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const createRemediationCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

// ===== Artifact schemas =====

export const createArtifactMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(ArtifactType),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

// ===== API Response envelope =====

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        page: z.number(),
        pageSize: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.record(z.unknown())).optional(),
  }),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type CreateRemediationInput = z.infer<typeof createRemediationSchema>;
export type UpdateRemediationInput = z.infer<typeof updateRemediationSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
