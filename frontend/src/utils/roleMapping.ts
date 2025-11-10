/**
 * Role mapping utility to map backend roles to frontend roles
 * Employer role has manager permissions by default
 */

export type FrontendRole = 'admin' | 'manager' | 'staff';
export type BackendRole = 'superadmin' | 'employer' | 'employee';

/**
 * Maps backend roles to frontend roles
 * @param backendRole - The role from the backend (superadmin, employer, employee)
 * @returns The corresponding frontend role (admin, manager, staff)
 */
export const mapBackendRoleToFrontend = (backendRole: string | undefined): FrontendRole | undefined => {
  if (!backendRole || typeof backendRole !== 'string' || backendRole.trim() === '') return undefined;
  
  // Map backend roles to frontend roles
  const roleMap: Record<string, FrontendRole> = {
    'superadmin': 'admin',
    'employer': 'manager', // Employer has manager permissions by default
    'employee': 'staff',
    // Also support frontend role names directly (for backward compatibility)
    'admin': 'admin',
    'manager': 'manager',
    'staff': 'staff',
  };
  
  const normalizedRole = backendRole.trim().toLowerCase();
  return roleMap[normalizedRole];
};

/**
 * Checks if a user role matches any of the allowed roles
 * @param userRole - The user's backend role
 * @param allowedRoles - Array of frontend roles that are allowed
 * @returns true if the user role matches any allowed role
 */
export const hasRole = (userRole: string | undefined, allowedRoles: FrontendRole[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const frontendRole = mapBackendRoleToFrontend(userRole);
  return frontendRole ? allowedRoles.includes(frontendRole) : false;
};

