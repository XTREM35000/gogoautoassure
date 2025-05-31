import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import { type UserRole } from '@/lib/supabase';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

interface PublicRouteProps {
  children: React.ReactNode;
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isLoading, initialized } = useAuthStore();
  const location = useLocation();

  if (isLoading || !initialized) {
    console.log('RoleRoute - Loading:', { isLoading, initialized });
    return <FullPageSpinner />;
  }

  if (!user) {
    console.log('RoleRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.log('RoleRoute - Unauthorized role:', user.role, 'Required:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('RoleRoute - Rendering content for role:', user.role);
  return <>{children}</>;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading, initialized } = useAuthStore();
  const location = useLocation();

  if (isLoading || !initialized) {
    console.log('PublicRoute - Loading:', { isLoading, initialized });
    return <FullPageSpinner />;
  }

  if (user) {
    console.log('PublicRoute - User found, redirecting to:', location.state?.from?.pathname || '/');
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  console.log('PublicRoute - Rendering public content');
  return <>{children}</>;
}
