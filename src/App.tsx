import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import LeadDetail from './pages/LeadDetail';
import Tasks from './pages/Tasks';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/integrations" element={<div className="p-4">Integrations (Configuración de Webhooks) - Ver Documentación</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
