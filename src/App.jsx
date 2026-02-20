import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Entry } from './pages/Entry';
import { Logs } from './pages/Logs';
import { ProtectedRoute } from './components/ProtectedRoute';

/**
 * Main App component
 * - Sets up routing with React Router
 * - Three routes: /login (public), /entry (protected), /logs (protected)
 * - Default route redirects to /entry
 * - PIN-based authentication (no email callbacks)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/entry"
          element={
            <ProtectedRoute>
              <Entry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect to entry */}
        <Route path="/" element={<Navigate to="/entry" replace />} />

        {/* Catch all - redirect to entry */}
        <Route path="*" element={<Navigate to="/entry" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
