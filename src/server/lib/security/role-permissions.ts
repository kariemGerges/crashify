// =============================================
// FILE: server/lib/security/role-permissions.ts
// Role-Based Permissions System (REQ-128)
// =============================================

import type { Role } from '@/server/lib/types/auth';

export type Permission =
    | 'users.create'
    | 'users.read'
    | 'users.update'
    | 'users.delete'
    | 'users.deactivate'
    | 'assessments.create'
    | 'assessments.read'
    | 'assessments.update'
    | 'assessments.delete'
    | 'assessments.export'
    | 'complaints.create'
    | 'complaints.read'
    | 'complaints.update'
    | 'complaints.delete'
    | 'settings.read'
    | 'settings.update'
    | 'reports.generate'
    | 'reports.export'
    | 'audit_logs.read'
    | 'backup.create'
    | 'backup.restore'
    | 'api_keys.create'
    | 'api_keys.read'
    | 'api_keys.delete';

// Define permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    super_admin: [
        // Super Admin has all permissions
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'users.deactivate',
        'assessments.create',
        'assessments.read',
        'assessments.update',
        'assessments.delete',
        'assessments.export',
        'complaints.create',
        'complaints.read',
        'complaints.update',
        'complaints.delete',
        'settings.read',
        'settings.update',
        'reports.generate',
        'reports.export',
        'audit_logs.read',
        'backup.create',
        'backup.restore',
        'api_keys.create',
        'api_keys.read',
        'api_keys.delete',
    ],
    admin: [
        'users.create',
        'users.read',
        'users.update',
        'users.deactivate',
        'assessments.create',
        'assessments.read',
        'assessments.update',
        'assessments.delete',
        'assessments.export',
        'complaints.create',
        'complaints.read',
        'complaints.update',
        'complaints.delete',
        'settings.read',
        'settings.update',
        'reports.generate',
        'reports.export',
        'audit_logs.read',
        'backup.create',
        'api_keys.create',
        'api_keys.read',
        'api_keys.delete',
    ],
    assessor: [
        'assessments.create',
        'assessments.read',
        'assessments.update',
        'complaints.read',
        'reports.generate',
    ],
    read_only: [
        'assessments.read',
        'complaints.read',
        'reports.generate',
        'audit_logs.read',
    ],
    reviewer: [
        'assessments.read',
        'assessments.update',
        'complaints.read',
        'complaints.update',
        'reports.generate',
    ],
    manager: [
        'users.read',
        'assessments.create',
        'assessments.read',
        'assessments.update',
        'assessments.export',
        'complaints.create',
        'complaints.read',
        'complaints.update',
        'reports.generate',
        'reports.export',
    ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role can perform write operations
 */
export function canWrite(role: Role): boolean {
    return role !== 'read_only';
}

/**
 * Check if role can delete resources
 */
export function canDelete(role: Role): boolean {
    return ['super_admin', 'admin'].includes(role);
}

/**
 * Check if role can manage users
 */
export function canManageUsers(role: Role): boolean {
    return ['super_admin', 'admin', 'manager'].includes(role);
}

/**
 * Check if role can access settings
 */
export function canAccessSettings(role: Role): boolean {
    return ['super_admin', 'admin'].includes(role);
}

