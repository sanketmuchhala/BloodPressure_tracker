import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * - Wraps protected pages that require authentication
 * - Redirects to /login if user is not authenticated via PIN
 */
export function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
