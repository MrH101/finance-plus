import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasRole, FrontendRole } from '../../utils/roleMapping';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: FrontendRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0) {
    const backendRole = (user as any)?.role as string | undefined;
    if (!hasRole(backendRole, allowedRoles)) return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute; 