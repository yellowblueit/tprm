import { UserRole } from '../types/user.types.js';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | '*')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.MSP_ADMIN]: [{ resource: '*', actions: ['*'] }],
  [UserRole.MSP_USER]: [
    { resource: 'vendors', actions: ['create', 'read', 'update'] },
    { resource: 'artifacts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'assessments', actions: ['*'] },
    { resource: 'remediations', actions: ['*'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'reports', actions: ['create', 'read'] },
    { resource: 'tenants', actions: ['read'] },
    { resource: 'compliance', actions: ['*'] },
    { resource: 'subprocessors', actions: ['*'] },
    { resource: 'monitoring', actions: ['read', 'update'] },
    { resource: 'review-cycles', actions: ['*'] },
  ],
  [UserRole.TENANT_ADMIN]: [
    { resource: 'vendors', actions: ['*'] },
    { resource: 'artifacts', actions: ['*'] },
    { resource: 'assessments', actions: ['*'] },
    { resource: 'remediations', actions: ['*'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'reports', actions: ['*'] },
    { resource: 'users', actions: ['*'] },
    { resource: 'settings', actions: ['*'] },
    { resource: 'compliance', actions: ['*'] },
    { resource: 'subprocessors', actions: ['*'] },
    { resource: 'monitoring', actions: ['read', 'update'] },
    { resource: 'review-cycles', actions: ['*'] },
  ],
  [UserRole.TENANT_USER]: [
    { resource: 'vendors', actions: ['create', 'read', 'update'] },
    { resource: 'artifacts', actions: ['create', 'read', 'update'] },
    { resource: 'assessments', actions: ['read'] },
    { resource: 'remediations', actions: ['create', 'read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'compliance', actions: ['read'] },
    { resource: 'subprocessors', actions: ['read'] },
    { resource: 'monitoring', actions: ['read'] },
    { resource: 'review-cycles', actions: ['read'] },
  ],
  [UserRole.VENDOR_USER]: [
    { resource: 'portal', actions: ['*'] },
  ],
};

export function hasPermission(
  role: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some(
    (p) =>
      (p.resource === '*' || p.resource === resource) &&
      (p.actions.includes('*') || p.actions.includes(action as never))
  );
}
