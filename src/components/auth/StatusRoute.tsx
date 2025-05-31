import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import { type UserStatus } from '@/lib/supabase';

interface StatusRouteProps {
  children: React.ReactNode;
  requiredStatus?: UserStatus;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function StatusRoute({ children, requiredStatus }: StatusRouteProps) {
  const { user, isLoading, initialized } = useAuthStore();
  const location = useLocation();

  if (isLoading || !initialized) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredStatus && user.status !== requiredStatus) {
    if (user.status === 'suspended' || user.status === 'blocked') {
      return <Navigate to="/account-restricted" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading, initialized } = useAuthStore();
  const location = useLocation();

  if (isLoading || !initialized) {
    return <FullPageSpinner />;
  }

  if (user) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
