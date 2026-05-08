import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.redirectTo='/admin/login'] — where unauthenticated users go
 */
export default function PrivateRoute({ children, redirectTo = '/admin/login' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Still loading authentication state
    return null;
  }

  if (!user) {
    // Not authenticated
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (user.mustChangePassword && !location.pathname.startsWith('/admin/change-password')) {
    return <Navigate to="/admin/change-password" replace state={{ from: location.pathname }} />;
  }

  return children;
}
