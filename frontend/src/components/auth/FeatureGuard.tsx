import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasRole, FrontendRole } from '../../utils/roleMapping';

export function withFeatureGuard<P>(
  Component: React.ComponentType<P>,
  options: { allowedRoles?: FrontendRole[]; fallback?: React.ReactNode } = {}
) {
  const { allowedRoles, fallback = null } = options;
  const Guarded: React.FC<P> = (props) => {
    const { user } = useAuth();
    if (!allowedRoles || allowedRoles.length === 0) return <Component {...(props as P)} />;
    if (!user) return <>{fallback}</>;
    
    // Comprehensive role extraction - same as Guard component
    const userAny = user as any;
    let roleValue: string | null = null;
    
    if (userAny?.role) {
      roleValue = userAny.role;
    } else if (userAny?.user_role) {
      roleValue = userAny.user_role;
    } else if (userAny?.user?.role) {
      roleValue = userAny.user.role;
    } else if (typeof userAny === 'object' && userAny !== null) {
      const keys = Object.keys(userAny);
      for (const key of keys) {
        if (key.toLowerCase().includes('role')) {
          roleValue = userAny[key];
          break;
        }
      }
    }
    
    const role = roleValue ? String(roleValue).trim().toLowerCase() : '';
    
    // EMPLOYER = MANAGER PERMISSIONS - Explicit mapping
    let frontendRole: FrontendRole | undefined = undefined;
    
    if (role === 'employer' || role === 'manager') {
      frontendRole = 'manager';
    } else if (role === 'superadmin' || role === 'admin') {
      frontendRole = 'admin';
    } else if (role === 'employee' || role === 'staff') {
      frontendRole = 'staff';
    }
    
    const hasAccess = frontendRole ? allowedRoles.includes(frontendRole) : false;
    if (hasAccess) return <Component {...(props as P)} />;
    
    return <>{fallback}</>;
  };
  Guarded.displayName = `withFeatureGuard(${Component.displayName || Component.name || 'Component'})`;
  return Guarded;
}

export const Guard: React.FC<{ allowedRoles?: FrontendRole[]; children: React.ReactNode; fallback?: React.ReactNode }> = ({ allowedRoles, children, fallback = null }) => {
  const { user, isLoading } = useAuth();
  
  // No restrictions - allow all
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }
  
  // Still loading or no user - show fallback
  if (isLoading || !user) {
    return <>{fallback}</>;
  }
  
  // Get role - backend UserSerializer includes 'role' field directly
  const userAny = user as any;
  const roleValue = userAny?.role;
  const role = roleValue ? String(roleValue).trim().toLowerCase() : '';
  
  // EMPLOYER = MANAGER PERMISSIONS - Explicit check
  // If role is employer and manager is allowed, grant access
  if (role === 'employer' && allowedRoles.includes('manager')) {
    return <>{children}</>;
  }
  
  // If role is manager and manager is allowed, grant access
  if (role === 'manager' && allowedRoles.includes('manager')) {
    return <>{children}</>;
  }
  
  // If role is superadmin or admin and admin is allowed, grant access
  if ((role === 'superadmin' || role === 'admin') && allowedRoles.includes('admin')) {
    return <>{children}</>;
  }
  
  // If role is employee or staff and staff is allowed, grant access
  if ((role === 'employee' || role === 'staff') && allowedRoles.includes('staff')) {
    return <>{children}</>;
  }
  
  // Debug logging
  console.log('[Guard] Access denied:', {
    user: userAny,
    role: role,
    allowedRoles: allowedRoles
  });
  
  return <>{fallback}</>;
}; 