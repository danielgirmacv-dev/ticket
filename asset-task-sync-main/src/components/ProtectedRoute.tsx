import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('super_admin' | 'admin' | 'technician' | 'requester')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && role) {
    const rolesToCheck = [...allowedRoles];
    // If admin is allowed, super_admin is also allowed
    if (rolesToCheck.includes('admin') && !rolesToCheck.includes('super_admin')) {
      rolesToCheck.push('super_admin');
    }

    if (!rolesToCheck.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
