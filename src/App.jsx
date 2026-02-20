import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Entry } from './pages/Entry';
import { Logs } from './pages/Logs';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LangProvider } from './i18n/LangContext';

function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/entry" element={<ProtectedRoute><Entry /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/entry" replace />} />
          <Route path="*" element={<Navigate to="/entry" replace />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}

export default App;
