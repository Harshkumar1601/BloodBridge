import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/ui';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children || <Outlet />}</>;
}

export function PublicRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children || <Outlet />}</>;
}
