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
import Agentes from './pages/Agentes';
import AgentDetail from './pages/AgentDetail';

import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      const message = event.reason?.message || 'Ocurrió un error inesperado en la base de datos o API.';
      toast.error(message, {
        description: 'Por favor, verifica tu conexión o contacta a soporte si el problema persiste.'
      });
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/agentes" element={<Agentes />} />
              <Route path="/agentes/:id" element={<AgentDetail />} />
              <Route path="/integrations" element={<div className="p-4">Integrations (Configuración de Webhooks) - Ver Documentación</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
